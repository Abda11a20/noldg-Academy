import { useCallback, useState } from "react";
import { createDeviceChangeRequest, getMyDeviceChangeRequest } from "@noldg/api/endpoints/auth";
import { AppError } from "@noldg/api/errors";
import { capabilities } from "@noldg/api/config/capabilities";
import { useAuthForm } from "./useAuthForm";

/** Loads and creates device change requests while translating unsupported live capabilities. */
export function useDeviceChange() {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">();
  const [reason, setReason] = useState("");
  const state = useAuthForm();
  const { onFailure, setErrorKey } = state;
  const loadStatus = useCallback(async () => {
    setErrorKey(null);
    try {
      setStatus((await getMyDeviceChangeRequest()).status);
    } catch (error) {
      if (error instanceof AppError && error.code === "DEVICE_NOT_REGISTERED") {
        setStatus(undefined);
        return;
      }
      onFailure(error);
    }
  }, [onFailure, setErrorKey]);
  const createRequest = async () => {
    if (state.pending) return;
    state.setPending(true);
    state.setErrorKey(null);
    try {
      const result = await createDeviceChangeRequest({ ...(reason ? { reason } : {}) });
      setStatus(result.status);
      setReason("");
    } catch (error) {
      state.onFailure(error);
    } finally {
      state.setPending(false);
    }
  };
  return {
    status,
    reason,
    setReason,
    loadStatus,
    createRequest,
    requestAvailable: capabilities.deviceChangeRequest,
    ...state,
  };
}
