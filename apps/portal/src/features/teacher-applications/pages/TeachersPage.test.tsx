import { cleanup, screen } from "@testing-library/react";
import { delay, http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { Route, Routes } from "react-router";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { API_BASE_URL } from "@noldg/api/constants/http";
import { TeachersPage } from "./TeachersPage";
import { ApplicationDetailPage } from "./ApplicationDetailPage";
import { renderPage } from "../../../shared/testing/render-page";
import i18n from "../../../shared/i18n";

const empty = { items: [], page: 1, pageSize: 20, total: 0 };

beforeEach(async () => i18n.changeLanguage("en"));
afterEach(cleanup);

describe.each([
  { name: "applications", path: "teachers/applications", tab: "Applications" },
  { name: "active teachers", path: "users", tab: "Active teachers" },
  { name: "suspended teachers", path: "users", tab: "Suspended" },
])("teacher administration $name list", ({ path, tab }) => {
  function setup(handler: () => Response | Promise<Response>) {
    const user = userEvent.setup();
    nodeServer.use(http.get(`${API_BASE_URL}/${path}`, handler));
    renderPage(<TeachersPage />);
    return screen.findByRole("tab", { name: "Applications" }).then(async (applicationsTab) => {
      if (tab !== "Applications") await user.click(screen.getByRole("tab", { name: tab }));
      return applicationsTab;
    });
  }

  it("renders loading while the request is pending", async () => {
    const user = userEvent.setup();
    nodeServer.use(
      http.get(`${API_BASE_URL}/${path}`, async () => {
        await delay(100);
        return HttpResponse.json(empty);
      }),
    );
    renderPage(<TeachersPage />);
    if (tab !== "Applications") await user.click(await screen.findByRole("tab", { name: tab }));
    expect(document.querySelector(".animate-pulse")).not.toBeNull();
  });

  it("shows the empty state", async () => {
    await setup(() => HttpResponse.json(empty));
    expect(await screen.findByText("No teachers match this view.")).toBeTruthy();
  });

  it("shows a 403 permission state", async () => {
    await setup(() => HttpResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 }));
    expect(await screen.findByText("You do not have permission")).toBeTruthy();
  });

  it("shows a server error state", async () => {
    await setup(() => HttpResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 }));
    expect(await screen.findByText("Teacher management is unavailable")).toBeTruthy();
  });
});

it("renders application review conflict message and refetches the record", async () => {
  const user = userEvent.setup();
  let detailCalls = 0;
  nodeServer.use(
    http.get(`${API_BASE_URL}/teachers/applications/:applicationId`, () => {
      detailCalls += 1;
      return HttpResponse.json({
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
        bio: "Teacher",
        status: "pending",
        submittedAt: "2026-11-20T12:00:00.000Z",
        offerings: [],
      });
    }),
    http.post(`${API_BASE_URL}/teachers/applications/:applicationId/approve`, () =>
      HttpResponse.json({ error: { code: "ALREADY_REVIEWED" } }, { status: 409 }),
    ),
  );
  renderPage(
    <Routes>
      <Route
        path="/admin/teachers/applications/:applicationId"
        element={<ApplicationDetailPage />}
      />
    </Routes>,
    undefined,
    ["/admin/teachers/applications/application-1"],
  );
  await screen.findByRole("heading", { name: "Application timeline", hidden: true });
  await user.click(screen.getByRole("button", { name: "Approve" }));
  await user.click(await screen.findByRole("button", { name: "Save decision" }));
  expect(
    await screen.findByText("This application was already reviewed. The list was refreshed."),
  ).toBeTruthy();
  await screen.findByRole("heading", { name: "Application timeline", hidden: true });
  expect(detailCalls).toBeGreaterThan(1);
});

it("requires a minimum rejection reason before confirming", async () => {
  const user = userEvent.setup();
  nodeServer.use(
    http.get(`${API_BASE_URL}/teachers/applications/:applicationId`, () =>
      HttpResponse.json({
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
        bio: "Teacher",
        status: "pending",
        submittedAt: "2026-11-20T12:00:00.000Z",
        offerings: [],
      }),
    ),
  );
  renderPage(
    <Routes>
      <Route
        path="/admin/teachers/applications/:applicationId"
        element={<ApplicationDetailPage />}
      />
    </Routes>,
    undefined,
    ["/admin/teachers/applications/application-1"],
  );
  await screen.findByRole("heading", { name: "Application timeline" });
  await user.click(screen.getByRole("button", { name: "Reject" }));
  expect(
    (screen.getByRole("button", { name: "Save decision" }) as HTMLButtonElement).disabled,
  ).toBe(true);
  await user.type(screen.getByLabelText("Reason"), "A valid review reason");
  expect(
    (screen.getByRole("button", { name: "Save decision" }) as HTMLButtonElement).disabled,
  ).toBe(false);
});

it("shows a safe error and keeps the application open when approval fails", async () => {
  const user = userEvent.setup();
  nodeServer.use(
    http.get(`${API_BASE_URL}/teachers/applications/:applicationId`, () =>
      HttpResponse.json({
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
        bio: "Teacher",
        status: "pending",
        submittedAt: "2026-11-20T12:00:00.000Z",
        offerings: [],
      }),
    ),
    http.post(`${API_BASE_URL}/teachers/applications/:applicationId/approve`, () =>
      HttpResponse.json(
        { error: { code: "SERVER_ERROR", message: "private backend detail" } },
        { status: 500 },
      ),
    ),
  );
  renderPage(
    <Routes>
      <Route
        path="/admin/teachers/applications/:applicationId"
        element={<ApplicationDetailPage />}
      />
    </Routes>,
    undefined,
    ["/admin/teachers/applications/application-1"],
  );
  await screen.findByRole("heading", { name: "Application timeline" });
  await user.click(screen.getByRole("button", { name: "Approve" }));
  await user.click(await screen.findByRole("button", { name: "Save decision" }));
  expect(await screen.findByRole("dialog")).toBeTruthy();
  expect(await screen.findByText("The request could not be completed. Try again.")).toBeTruthy();
  expect(screen.queryByText("private backend detail")).toBeNull();
});

describe.each([
  {
    sourceTab: "Active teachers",
    trigger: "Suspend account",
    targetTab: "Suspended",
    accountName: "Salma Hassan",
  },
  {
    sourceTab: "Suspended",
    trigger: "Reactivate account",
    targetTab: "Active teachers",
    accountName: "Omar Nabil",
  },
])(
  "teacher account status action from $sourceTab",
  ({ sourceTab, trigger, targetTab, accountName }) => {
    it("updates the list after a valid reason", async () => {
      const user = userEvent.setup();
      renderPage(<TeachersPage />);
      await user.click(await screen.findByRole("tab", { name: sourceTab }));
      await screen.findAllByText(accountName);
      const triggers = screen.getAllByRole("button", { name: trigger });
      await user.click(triggers[0]!);
      await user.click(await screen.findByRole("menuitem", { name: trigger }));
      await user.type(screen.getByLabelText("Reason"), "Approved account status change");
      await user.click(screen.getByRole("button", { name: "Save decision" }));
      await user.click(await screen.findByRole("tab", { name: targetTab }));
      expect(await screen.findAllByText(accountName)).toBeTruthy();
    });

    it("keeps the dialog open and shows a safe error on server failure", async () => {
      const user = userEvent.setup();
      nodeServer.use(
        http.patch(`${API_BASE_URL}/users/:userId/status`, () =>
          HttpResponse.json(
            { error: { code: "SERVER_ERROR", message: "private backend detail" } },
            { status: 500 },
          ),
        ),
      );
      renderPage(<TeachersPage />);
      await user.click(await screen.findByRole("tab", { name: sourceTab }));
      await screen.findAllByText(accountName);
      const triggers = screen.getAllByRole("button", { name: trigger });
      await user.click(triggers[0]!);
      await user.click(await screen.findByRole("menuitem", { name: trigger }));
      await user.type(screen.getByLabelText("Reason"), "Approved account status change");
      await user.click(screen.getByRole("button", { name: "Save decision" }));
      expect(await screen.findByRole("dialog")).toBeTruthy();
      expect(screen.queryByText("private backend detail")).toBeNull();
    });
  },
);
