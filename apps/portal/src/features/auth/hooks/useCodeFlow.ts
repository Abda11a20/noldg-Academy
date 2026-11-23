import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { forgotPassword, resendCode, resetPassword, verifyEmail } from "@noldg/api/endpoints/auth";
import { AppError } from "@noldg/api/errors";
import { useCooldown } from "./useCooldown";
import { useAuthForm } from "./useAuthForm";
import { normalizeArabicDigits } from "../../../shared/normalize-arabic-digits";
import { AUTH_OTP_COOLDOWN_SECONDS } from "../constants";
import { ForgotPasswordFormSchema, ResetPasswordFormSchema } from "../schemas/forms";
import type { ResetPasswordFormValues } from "../schemas/forms";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";

interface EmailRouteState {
  email?: string;
  verificationUnavailable?: boolean;
  teacherRegistrationReceived?: boolean;
}

function useEmailState() {
  const location = useLocation();
  const state = location.state as EmailRouteState | null;
  return { email: state?.email ?? "", state };
}

/** Verifies email OTP and drives the visible resend cooldown without putting code in the URL. */
export function useVerifyEmailFlow() {
  const navigate = useNavigate();
  const { email, state } = useEmailState();
  const [code, setCode] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState<number | undefined>();
  const formState = useAuthForm();
  const cooldown = useCooldown(AUTH_OTP_COOLDOWN_SECONDS);
  const submit = async () => {
    if (formState.pending || code.length !== 6) return;
    formState.setPending(true);
    formState.setErrorKey(null);
    try {
      const result = await verifyEmail({ email, code: normalizeArabicDigits(code) });
      setRemainingAttempts(result.remainingAttempts);
      setCode("");
      await navigate(ROUTE_PATHS.login, {
        replace: true,
        state: {
          verified: true,
          teacherRegistrationReceived: state?.teacherRegistrationReceived,
          email,
        },
      });
    } catch (error) {
      formState.onFailure(error);
      if (error instanceof AppError && error.code === "OTP_RATE_LIMITED") {
        cooldown.startCooldown(AUTH_OTP_COOLDOWN_SECONDS);
        const details = error.details;
        if (details && typeof details === "object" && "remainingAttempts" in details) {
          setRemainingAttempts(Number(details.remainingAttempts));
        }
      }
      setCode("");
    } finally {
      formState.setPending(false);
    }
  };
  const resend = async () => {
    if (formState.pending || !cooldown.canResend) return;
    formState.setPending(true);
    formState.setErrorKey(null);
    try {
      const result = await resendCode({ email });
      cooldown.startCooldown(result.retryAfterSeconds ?? AUTH_OTP_COOLDOWN_SECONDS);
      setCode("");
    } catch (error) {
      formState.onFailure(error);
      if (error instanceof AppError && error.status === 429) {
        cooldown.startCooldown(AUTH_OTP_COOLDOWN_SECONDS);
      }
    } finally {
      formState.setPending(false);
    }
  };
  return {
    email,
    state,
    code,
    setCode,
    remainingAttempts,
    submit,
    resend,
    ...formState,
    ...cooldown,
  };
}

/** Sends an email recovery request and moves the email through router state only. */
export function useForgotPasswordFlow() {
  const navigate = useNavigate();
  const form = useForm<{ email: string }>({
    resolver: zodResolver(ForgotPasswordFormSchema),
    defaultValues: { email: "" },
  });
  const state = useAuthForm(form.setError);
  const submit = form.handleSubmit(async (values) => {
    if (state.pending) return;
    state.setPending(true);
    state.setErrorKey(null);
    try {
      await forgotPassword(values);
      const email = values.email;
      form.reset();
      await navigate(ROUTE_PATHS.resetPassword, { state: { email } });
    } catch (error) {
      state.onFailure(error);
      form.reset();
    } finally {
      state.setPending(false);
    }
  });
  return { form, submit, ...state };
}

/** Submits a one-time recovery code and confirmed password then returns to login. */
export function useResetPasswordFlow() {
  const navigate = useNavigate();
  const { email } = useEmailState();
  const form = useForm<ResetPasswordFormValues>({
    // Confirmation is a form-only field and is validated against the API password schema on submit.
    resolver: zodResolver(ResetPasswordFormSchema) as unknown as Resolver<ResetPasswordFormValues>,
    defaultValues: { email, code: "", password: "", passwordConfirmation: "" },
  });
  const state = useAuthForm(form.setError);
  const submit = form.handleSubmit(async (values) => {
    if (state.pending) return;
    if (values.password !== form.getValues("passwordConfirmation")) {
      form.setError("passwordConfirmation", { type: "validate", message: "passwordMismatch" });
      return;
    }
    state.setPending(true);
    state.setErrorKey(null);
    try {
      await resetPassword({
        email: values.email,
        code: normalizeArabicDigits(values.code),
        password: values.password,
      });
      form.reset();
      await navigate(ROUTE_PATHS.login, { replace: true, state: { passwordReset: true } });
    } catch (error) {
      state.onFailure(error);
      form.reset({ email: values.email, code: "", password: "", passwordConfirmation: "" });
    } finally {
      state.setPending(false);
    }
  });
  return { form, submit, ...state, email };
}
