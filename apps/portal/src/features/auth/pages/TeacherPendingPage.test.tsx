import { cleanup, screen } from "@testing-library/react";
import { http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it } from "vitest";
import type { AuthUser } from "@noldg/api/contracts/auth";
import { API_BASE_URL } from "@noldg/api/constants/http";
import { clearAuthSession, setAuthenticatedUser } from "../../../shared/auth/auth-store";
import i18n from "../../../shared/i18n";
import { renderPage } from "../../../shared/testing/render-page";
import { TeacherPendingPage } from "./TeacherPendingPage";

const rejectedApplication = {
  id: "application-1",
  userId: {
    id: "teacher-id",
    name: "Salma Hassan",
    email: "teacher-pending@example.test",
    phone: "+201000000001",
  },
  name: "Salma Hassan",
  email: "teacher-pending@example.test",
  phone: "+201000000001",
  bio: "Experienced mathematics teacher",
  status: "rejected",
  rejectionReason: "Please add more teaching details.",
  submittedAt: "2026-11-20T12:00:00.000Z",
  statusHistory: [
    { status: "pending", occurredAt: "2026-11-20T12:00:00.000Z" },
    {
      status: "rejected",
      occurredAt: "2026-11-21T12:00:00.000Z",
      reason: "Please add more teaching details.",
    },
  ],
  offerings: [
    {
      trackId: "track-1",
      subjectId: "subject-1",
      track: {
        id: "track-1",
        system: "general",
        stage: "secondary",
        grade: 1,
        name: "First secondary",
        active: true,
      },
      subject: { id: "subject-1", name: "Mathematics", active: true },
    },
  ],
};

const teacher: AuthUser = {
  id: "teacher-id",
  name: "Salma Hassan",
  email: "teacher-pending@example.test",
  role: "teacher",
  status: "active",
  emailVerified: true,
  applicationStatus: "rejected",
  rejectionReason: "Please add more teaching details.",
};

beforeEach(async () => {
  await i18n.changeLanguage("en");
  setAuthenticatedUser(teacher);
  nodeServer.use(
    http.get(`${API_BASE_URL}/teachers/me/application`, () =>
      HttpResponse.json(rejectedApplication),
    ),
    http.put(`${API_BASE_URL}/teachers/me/application`, () =>
      HttpResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "private backend detail" } },
        { status: 400 },
      ),
    ),
  );
});

afterEach(() => {
  cleanup();
  clearAuthSession();
});

it("shows a safe validation message when teacher resubmission is rejected", async () => {
  const user = userEvent.setup();
  renderPage(<TeacherPendingPage />);
  await user.click(await screen.findByRole("button", { name: "Edit and resubmit" }));
  expect(
    await screen.findByText("We could not resubmit your application. Please try again."),
  ).toBeTruthy();
  expect(screen.queryByText("private backend detail")).toBeNull();
  expect(screen.getByText("Please add more teaching details.")).toBeTruthy();
});
