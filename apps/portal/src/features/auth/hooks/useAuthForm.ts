import { useCallback, useState } from "react";
import type { FieldValues, UseFormSetError } from "react-hook-form";
import { applyValidationFieldErrors, authErrorKey } from "../utils/errors";

/** Provides shared pending/error state and safe validation mapping for auth submissions. */
export function useAuthForm<TValues extends FieldValues>(setError?: UseFormSetError<TValues>) {
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const onFailure = useCallback(
    (error: unknown) => {
      setErrorKey(authErrorKey(error));
      applyValidationFieldErrors(error, setError);
    },
    [setError, setErrorKey],
  );
  return { pending, setPending, errorKey, setErrorKey, onFailure };
}
