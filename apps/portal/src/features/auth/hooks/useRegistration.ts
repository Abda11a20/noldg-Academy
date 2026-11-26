import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { useNavigate } from "react-router";
import { getPublicCatalog, registerStudent, registerTeacher } from "@noldg/api/endpoints/auth";
import { capabilities } from "@noldg/api/config/capabilities";
import { AppError } from "@noldg/api/errors";
import type { AcademicCatalog } from "@noldg/api/contracts/auth";
import { StudentRegistrationFormSchema, TeacherRegistrationFormSchema } from "../schemas/forms";
import type {
  StudentRegistrationFormValues,
  TeacherRegistrationFormValues,
} from "../schemas/forms";
import { useAuthForm } from "./useAuthForm";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import { normalizeArabicDigits } from "../../../shared/normalize-arabic-digits";

function catalogTracks(catalog: AcademicCatalog | undefined, system: string) {
  return catalog?.tracks.filter((track) => track.system === system) ?? [];
}

/** Loads target catalog data safely and exposes dependent track and teacher-offering choices. */
function useRegistrationCatalog() {
  const [catalog, setCatalog] = useState<AcademicCatalog>();
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setUnavailable(false);
    try {
      setCatalog(await getPublicCatalog());
    } catch {
      setUnavailable(true);
      setCatalog(undefined);
    } finally {
      setLoading(false);
    }
  }, []);
  const tracksForSystem = (system: string) => catalogTracks(catalog, system);
  return { catalog, loading, unavailable, loadCatalog, tracksForSystem };
}

/** Manages student registration, catalog selections, and navigation to email verification. */
export function useStudentRegistration() {
  const navigate = useNavigate();
  const supportsStudentProfileFields = capabilities.studentProfileFields;
  const form = useForm<StudentRegistrationFormValues>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      parentPhone: "",
      password: "",
      passwordConfirmation: "",
      trackId: "",
    },
    // Extra confirmation input is validated in the submit handler; the API schema checks request fields.
    resolver: zodResolver(
      supportsStudentProfileFields
        ? StudentRegistrationFormSchema
        : StudentRegistrationFormSchema.omit({
            parentPhone: true,
            trackId: true,
            acceptTerms: true,
          }),
    ) as unknown as Resolver<StudentRegistrationFormValues>,
  });
  const state = useAuthForm(form.setError);
  const catalog = useRegistrationCatalog();
  const loadCatalog = catalog.loadCatalog;
  const loadStudentCatalog = useCallback(async () => {
    if (supportsStudentProfileFields) await loadCatalog();
  }, [loadCatalog, supportsStudentProfileFields]);
  const submit = form.handleSubmit(async (values) => {
    if (state.pending) return;
    if (values.password !== form.getValues("passwordConfirmation")) {
      form.setError("passwordConfirmation", { type: "validate", message: "passwordMismatch" });
      return;
    }
    state.setPending(true);
    state.setErrorKey(null);
    try {
      const identity = {
        name: values.name,
        email: values.email,
        phone: normalizeArabicDigits(values.phone),
        password: values.password,
      };
      const result = await registerStudent(
        supportsStudentProfileFields
          ? {
              ...identity,
              parentPhone: normalizeArabicDigits(values.parentPhone),
              trackId: values.trackId,
              acceptTerms: values.acceptTerms,
            }
          : identity,
      );
      form.reset();
      await navigate(
        result.emailVerificationRequired ? ROUTE_PATHS.verifyEmail : ROUTE_PATHS.login,
        {
          replace: true,
          state: {
            email: values.email,
            verificationUnavailable: !result.emailVerificationRequired,
          },
        },
      );
    } catch (error) {
      // Reset sensitive values before mapping server errors so field errors remain visible.
      form.reset({
        ...values,
        password: "",
        passwordConfirmation: "",
      });
      state.onFailure(error);
      if (error instanceof AppError && error.code === "CAPABILITY_UNAVAILABLE") {
        state.setErrorKey("auth:student.catalogUnavailable");
      }
    } finally {
      state.setPending(false);
    }
  });
  return {
    form,
    submit,
    ...state,
    ...catalog,
    loadCatalog: loadStudentCatalog,
    unavailable: !supportsStudentProfileFields || catalog.unavailable,
    supportsStudentProfileFields,
  };
}

export interface TeacherOfferingSelection {
  trackId: string;
  subjectId: string;
  system: string;
  trackName: string;
  subjectName: string;
}

/** Manages teacher application fields and the normalized removable offering selection. */
export function useTeacherRegistration() {
  const navigate = useNavigate();
  const [offerings, setOfferings] = useState<TeacherOfferingSelection[]>([]);
  const [selectedSystem, setSelectedSystem] = useState("");
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<File>();
  const form = useForm<TeacherRegistrationFormValues>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      passwordConfirmation: "",
      bio: "",
      offerings: [],
    },
    // Extra confirmation input is validated in the submit handler; the API schema checks request fields.
    resolver: zodResolver(
      TeacherRegistrationFormSchema,
    ) as unknown as Resolver<TeacherRegistrationFormValues>,
  });
  const state = useAuthForm(form.setError);
  const catalog = useRegistrationCatalog();
  const tracks = catalog.tracksForSystem(selectedSystem);
  const subjects = tracks
    .filter((track) => selectedTrackIds.includes(track.id))
    .flatMap((track) =>
      track.subjects.map((subject) => ({
        ...subject,
        trackId: track.id,
        trackName: track.name,
        system: track.system,
      })),
    );
  const toggleSelection = (values: string[], value: string, update: (next: string[]) => void) => {
    update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };
  const addOfferings = () => {
    const next = subjects.filter((subject) => selectedSubjectIds.includes(subject.id));
    const existing = new Set(offerings.map((item) => `${item.trackId}:${item.subjectId}`));
    const additions = next
      .filter((item) => !existing.has(`${item.trackId}:${item.id}`))
      .map((item) => ({
        trackId: item.trackId,
        subjectId: item.id,
        system: item.system,
        trackName: item.trackName,
        subjectName: item.name,
      }));
    const updated = [...offerings, ...additions];
    setOfferings(updated);
    form.setValue(
      "offerings",
      updated.map(({ trackId, subjectId }) => ({ trackId, subjectId })),
      { shouldValidate: true },
    );
    setSelectedSubjectIds([]);
  };
  const removeOffering = (trackId: string, subjectId: string) => {
    const updated = offerings.filter(
      (item) => item.trackId !== trackId || item.subjectId !== subjectId,
    );
    setOfferings(updated);
    form.setValue(
      "offerings",
      updated.map(({ trackId: selectedTrackId, subjectId: selectedSubjectId }) => ({
        trackId: selectedTrackId,
        subjectId: selectedSubjectId,
      })),
      { shouldValidate: true },
    );
  };
  const selectSystem = (system: string) => {
    setSelectedSystem(system);
    setSelectedTrackIds([]);
    setSelectedSubjectIds([]);
  };
  const submit = form.handleSubmit(async (values) => {
    if (state.pending) return;
    if (values.password !== form.getValues("passwordConfirmation")) {
      form.setError("passwordConfirmation", { type: "validate", message: "passwordMismatch" });
      return;
    }
    if (!offerings.length) {
      form.setError("offerings", { type: "required", message: "offerings" });
      return;
    }
    state.setPending(true);
    state.setErrorKey(null);
    try {
      const result = await registerTeacher({
        name: values.name,
        email: values.email,
        phone: normalizeArabicDigits(values.phone),
        password: values.password,
        bio: values.bio,
        offerings: offerings.map(({ trackId, subjectId }) => ({ trackId, subjectId })),
        image: selectedImage ?? values.image,
        acceptTerms: true,
      });
      form.reset();
      setSelectedImage(undefined);
      await navigate(
        result.emailVerificationRequired ? ROUTE_PATHS.verifyEmail : ROUTE_PATHS.teacherPending,
        { replace: true, state: { email: values.email, teacherRegistrationReceived: true } },
      );
    } catch (error) {
      form.reset({ ...values, password: "", passwordConfirmation: "" });
      state.onFailure(error);
    } finally {
      state.setPending(false);
    }
  });
  return {
    form,
    submit,
    ...state,
    ...catalog,
    offerings,
    selectedSystem,
    selectedTrackIds,
    selectedSubjectIds,
    selectedImage,
    tracks,
    subjects,
    selectSystem,
    toggleTrack: (id: string) => toggleSelection(selectedTrackIds, id, setSelectedTrackIds),
    toggleSubject: (id: string) => toggleSelection(selectedSubjectIds, id, setSelectedSubjectIds),
    addOfferings,
    removeOffering,
    setSelectedImage,
  };
}
