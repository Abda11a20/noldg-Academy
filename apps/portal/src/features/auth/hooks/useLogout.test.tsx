import { act, type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { AUTH_SCENARIO_EMAILS, MOCK_AUTH_USERS } from "@noldg/api/mocks/fixtures/auth";
import { describe, expect, it } from "vitest";
import { setAuthenticatedUser, useAuthSnapshot } from "../../../shared/auth/auth-store";
import { renderHook } from "../../../shared/testing/render-hook";
import { useLogout } from "./useLogout";

const queryClient = new QueryClient();

function ProviderWrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function useLogoutWithSession() {
  return { logout: useLogout(), session: useAuthSnapshot() };
}

describe("useLogout", () => {
  it("clears auth state and query cache even after server logout", async () => {
    queryClient.setQueryData(["private-data"], { value: "private" });
    const mockStudent = MOCK_AUTH_USERS[AUTH_SCENARIO_EMAILS.student];
    if (!mockStudent) throw new Error("Student mock fixture is missing.");
    setAuthenticatedUser(mockStudent);
    const hook = renderHook(useLogoutWithSession, { wrapper: ProviderWrapper });
    await act(async () => hook.result.logout.signOut());
    expect(hook.result.session.status).toBe("anonymous");
    expect(queryClient.getQueryData(["private-data"])).toBeUndefined();
    expect(hook.result.logout.loggingOut).toBe(false);
  });
});
