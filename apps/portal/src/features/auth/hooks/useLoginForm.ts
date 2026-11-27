import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router";
import { login } from "@noldg/api/endpoints/auth";
import { AppError } from "@noldg/api/errors";
import { LoginFormSchema, type LoginFormValues } from "../schemas/forms";
import { useAuthForm } from "./useAuthForm";
import { useCooldown } from "./useCooldown";
import { setAuthenticatedUser } from "../../../shared/auth/auth-store";
import { resolvePostLoginDestination } from "../utils/routing";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";

interface LoginFailureContext {
  error: unknown;
  state: ReturnType<typeof useAuthForm>;
  cooldown: ReturnType<typeof useCooldown>;
  navigate: ReturnType<typeof useNavigate>;
  clearPassword: () => void;
}

function retryAfterSeconds(error: AppError): number {
  const details = error.details;
  if (!details || typeof details !== "object" || !("retryAfterSeconds" in details)) return 30;
  const seconds = Number(details.retryAfterSeconds);
  return Number.isFinite(seconds) ? seconds : 30;
}

async function handleLoginFailure(context: LoginFailureContext): Promise<void> {
  const { error, state, cooldown, navigate, clearPassword } = context;
  state.onFailure(error);
  if (error instanceof AppError && error.code === "DEVICE_NOT_REGISTERED")
    await navigate(ROUTE_PATHS.deviceBlocked, { replace: true });
  if (error instanceof AppError && error.code === "ACCOUNT_SUSPENDED")
    await navigate(ROUTE_PATHS.accountSuspended, { replace: true });
  if (error instanceof AppError && error.status === 429)
    cooldown.startCooldown(retryAfterSeconds(error));
  clearPassword();
}

/** Validates login fields, clears the password after submission, and navigates by safe intent or role. */
export function useLoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: { email: "", password: "" },
  });
  const state = useAuthForm(form.setError);
  const cooldown = useCooldown();
  const submit = form.handleSubmit(async (values) => {
    if (state.pending || cooldown.secondsRemaining > 0) return;
    state.setPending(true);
    state.setErrorKey(null);
    try {
      const result = await login(values);
      setAuthenticatedUser(result.user);
      const destination = resolvePostLoginDestination(result.user, searchParams.get("returnTo"));
      await navigate(destination, { replace: true });
      form.reset({ email: "", password: "" });
    } catch (error) {
      await handleLoginFailure({
        error,
        state,
        cooldown,
        navigate,
        clearPassword: () => form.setValue("password", "", { shouldValidate: false }),
      });
    } finally {
      state.setPending(false);
    }
  });
  return { form, submit, ...state, ...cooldown };
}
