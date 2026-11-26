import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { resubmitTeacherApplication } from "@noldg/api/endpoints/admin";
import type { TeacherApplication } from "@noldg/api/contracts/admin";
import type { AcademicCatalog } from "@noldg/api/contracts/auth";
import type { TeacherOfferingSelection } from "./useRegistration";
import { useAuthSnapshot } from "../../../shared/auth/auth-store";
import { normalizeArabicDigits } from "../../../shared/normalize-arabic-digits";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import { AUTH_IMAGE_MAX_BYTES } from "../constants";

interface ResubmissionFields {
  name: string;
  email: string;
  phone: string;
  bio: string;
}

interface UseTeacherResubmissionParams {
  application: TeacherApplication;
  catalog?: AcademicCatalog;
  onSuccess: () => void;
}

/** Owns the teacher profile, offerings, and submit behavior for a resubmission form.
 * @param params Current application, optional catalog, and success callback.
 * @returns Form state and controlled event handlers for the presentation component.
 */
export function useTeacherResubmission({
  application,
  catalog,
  onSuccess,
}: UseTeacherResubmissionParams) {
  const navigate = useNavigate();
  const user = useAuthSnapshot().user;
  const [pending, setPending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File>();
  const [error, setError] = useState<"pending.resubmitFailed">();
  const [offerings, setOfferings] = useState<TeacherOfferingSelection[]>(() =>
    application.offerings.map((item) => ({
      trackId: item.trackId,
      subjectId: item.subjectId,
      system: item.track?.system ?? "general",
      trackName: item.track?.name ?? item.trackId,
      subjectName: item.subject?.name ?? item.subjectId,
    })),
  );
  const [system, setSystem] = useState("");
  const [trackIds, setTrackIds] = useState<string[]>([]);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const form = useForm<ResubmissionFields>({
    defaultValues: {
      name: application.name,
      email: application.email,
      phone: application.phone,
      bio: application.bio,
    },
  });
  const tracks = catalog?.tracks.filter((item) => item.system === system) ?? [];
  const subjects = tracks
    .filter((track) => trackIds.includes(track.id))
    .flatMap((track) =>
      track.subjects.map((subject) => ({
        ...subject,
        trackId: track.id,
        trackName: track.name,
        system: track.system,
      })),
    );
  const selectedFiles = selectedImage
    ? [{ name: selectedImage.name, size: `${Math.ceil(selectedImage.size / 1024)} KB` }]
    : [];

  const toggle = (values: string[], id: string, update: (next: string[]) => void) =>
    update(values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);
  const addOfferings = () => {
    const existing = new Set(offerings.map((item) => `${item.trackId}:${item.subjectId}`));
    const additions = subjects
      .filter(
        (subject) =>
          subjectIds.includes(subject.id) && !existing.has(`${subject.trackId}:${subject.id}`),
      )
      .map((subject) => ({
        trackId: subject.trackId,
        subjectId: subject.id,
        system: subject.system,
        trackName: subject.trackName,
        subjectName: subject.name,
      }));
    setOfferings((current) => [...current, ...additions]);
    setSubjectIds([]);
  };
  const onSystemChange = (value: string) => {
    setSystem(value);
    setTrackIds([]);
    setSubjectIds([]);
  };
  const onImageSelected = (files: FileList) => {
    const file = files.item(0);
    if (file && file.type.startsWith("image/") && file.size <= AUTH_IMAGE_MAX_BYTES)
      setSelectedImage(file);
  };
  const onRemoveOffering = (trackId: string, subjectId: string) =>
    setOfferings((current) =>
      current.filter((item) => item.trackId !== trackId || item.subjectId !== subjectId),
    );
  const submit = form.handleSubmit(async (values) => {
    if (pending || !user || offerings.length === 0) return;
    setPending(true);
    setError(undefined);
    const body = new FormData();
    body.set("name", values.name);
    body.set("email", values.email);
    body.set("phone", normalizeArabicDigits(values.phone));
    body.set("bio", values.bio);
    body.set(
      "offerings",
      JSON.stringify(offerings.map(({ trackId, subjectId }) => ({ trackId, subjectId }))),
    );
    if (selectedImage) body.set("image", selectedImage);
    try {
      await resubmitTeacherApplication(body, {
        id: user.id,
        name: values.name,
        email: values.email,
      });
      form.reset({ ...values });
      setSelectedImage(undefined);
      await onSuccess();
      await navigate(ROUTE_PATHS.teacherPending, { replace: true });
    } catch {
      form.reset({ ...values });
      setError("pending.resubmitFailed");
    } finally {
      setPending(false);
    }
  });

  return {
    addOfferings,
    error,
    form,
    onImageSelected,
    onRemoveOffering,
    onSubjectToggle: (id: string) => toggle(subjectIds, id, setSubjectIds),
    onSystemChange,
    onTrackToggle: (id: string) => toggle(trackIds, id, setTrackIds),
    offerings,
    pending,
    selectedFiles,
    submit,
    subjectIds,
    system,
    trackIds,
  };
}
