import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { delay, http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { API_BASE_URL } from "@noldg/api/constants/http";
import { AcademicPage } from "./AcademicPage";
import { renderPage } from "../../../shared/testing/render-page";
import i18n from "../../../shared/i18n";

const empty = { items: [], page: 1, pageSize: 20, total: 0 };
const academicCases = [
  { name: "tracks", path: "academic/tracks", tab: undefined },
  { name: "subjects", path: "academic/subjects", tab: "Subjects" },
] as const;

beforeEach(async () => i18n.changeLanguage("en"));
afterEach(cleanup);

describe.each(academicCases)("academic $name page list", ({ path, tab }) => {
  async function openList() {
    const user = userEvent.setup();
    renderPage(<AcademicPage />);
    if (tab) await user.click(await screen.findByRole("tab", { name: tab }));
  }

  it("shows the loading state while the server response is pending", async () => {
    nodeServer.use(
      http.get(`${API_BASE_URL}/${path}`, async () => {
        await delay(1000);
        return HttpResponse.json(empty);
      }),
    );
    await openList();
    expect(document.querySelector(".animate-pulse")).not.toBeNull();
  });

  it("shows an empty state", async () => {
    nodeServer.use(http.get(`${API_BASE_URL}/${path}`, () => HttpResponse.json(empty)));
    await openList();
    expect(await screen.findByText("No records match these filters.")).toBeTruthy();
  });

  it("shows a permission state for 403", async () => {
    nodeServer.use(
      http.get(`${API_BASE_URL}/${path}`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 }),
      ),
    );
    await openList();
    expect(await screen.findByText("You do not have permission")).toBeTruthy();
  });

  it("shows a recoverable error state for server failure", async () => {
    nodeServer.use(
      http.get(`${API_BASE_URL}/${path}`, () =>
        HttpResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 }),
      ),
    );
    await openList();
    expect(await screen.findByText("This feature is unavailable")).toBeTruthy();
  });
});

it("loads and reports a forbidden track-subject mapping page", async () => {
  const user = userEvent.setup();
  nodeServer.use(
    http.get(`${API_BASE_URL}/academic/tracks/:trackId/subjects`, () =>
      HttpResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 }),
    ),
  );
  renderPage(<AcademicPage />);
  await user.click(await screen.findByRole("tab", { name: "Track subjects" }));
  const trackSelect = await screen.findByRole("combobox", { name: "Track" });
  fireEvent.keyDown(trackSelect, { key: "ArrowDown" });
  await user.keyboard("{Enter}");
  expect(await screen.findByText("You do not have permission")).toBeTruthy();
});

describe.each([
  {
    name: "loading",
    handler: async () => {
      await delay(100);
      return HttpResponse.json([]);
    },
    expected: "loading",
  },
  { name: "empty", handler: () => HttpResponse.json([]), expected: "empty" },
  {
    name: "error",
    handler: () => HttpResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 }),
    expected: "error",
  },
])("track-subject mapping $name state", ({ handler, expected }) => {
  it("renders the state from the mapping request", async () => {
    const user = userEvent.setup();
    nodeServer.use(http.get(`${API_BASE_URL}/academic/tracks/:trackId/subjects`, handler));
    renderPage(<AcademicPage />);
    await user.click(await screen.findByRole("tab", { name: "Track subjects" }));
    const trackSelect = await screen.findByRole("combobox", { name: "Track" });
    fireEvent.keyDown(trackSelect, { key: "ArrowDown" });
    await user.keyboard("{Enter}");

    if (expected === "loading") {
      expect(document.querySelector(".animate-pulse")).not.toBeNull();
      return;
    }
    if (expected === "empty") {
      expect(await screen.findByRole("combobox", { name: "Subject" })).toBeTruthy();
      expect(screen.queryByText("Mathematics")).toBeNull();
      return;
    }
    expect(await screen.findByText("This feature is unavailable")).toBeTruthy();
  });
});

it("adds and removes a subject from a track mapping", async () => {
  const user = userEvent.setup();
  renderPage(<AcademicPage />);
  await user.click(await screen.findByRole("tab", { name: "Track subjects" }));
  const trackSelect = await screen.findByRole("combobox", { name: "Track" });
  fireEvent.keyDown(trackSelect, { key: "ArrowDown" });
  await user.keyboard("{Enter}");
  const subjectSelect = await screen.findByRole("combobox", { name: "Subject" });
  fireEvent.keyDown(subjectSelect, { key: "ArrowDown" });
  await user.keyboard("{Enter}");
  await user.click(screen.getByRole("button", { name: "Link subject" }));
  expect(await screen.findByText("Physics")).toBeTruthy();
  const removeButtons = screen.getAllByRole("button", { name: "Remove link" });
  const removeAddedSubject = removeButtons.at(-1);
  if (!removeAddedSubject) throw new Error("Expected the linked subject removal action.");
  await user.click(removeAddedSubject);
  await waitFor(() => expect(screen.queryByText("Physics")).toBeNull());
});

it("shows validation for the American Diploma prep combination without submitting", async () => {
  const user = userEvent.setup();
  renderPage(<AcademicPage />);
  await user.click(await screen.findByRole("button", { name: "Add track" }));
  const systemSelect = screen.getByRole("combobox", { name: "System" });
  fireEvent.keyDown(systemSelect, { key: "ArrowDown" });
  await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");
  expect(screen.queryByRole("option", { name: "Preparatory" })).toBeNull();
  await waitFor(() => expect(screen.getByRole("combobox", { name: "Stage" })).toBeTruthy());
  await user.keyboard("{Escape}");
});

it("creates, edits, and disables a track through the page", async () => {
  const user = userEvent.setup();
  renderPage(<AcademicPage />);

  await user.click(await screen.findByRole("button", { name: "Add track" }));
  await user.type(screen.getByRole("textbox", { name: "Name" }), "Third preparatory");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findAllByText("Third preparatory")).toHaveLength(2);

  const createdRow = screen.getByRole("row", { name: /Third preparatory/ });
  await user.click(within(createdRow).getByRole("button", { name: "Edit" }));
  const nameField = screen.getByRole("textbox", { name: "Name" });
  await user.clear(nameField);
  await user.type(nameField, "Third preparatory updated");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findAllByText("Third preparatory updated")).toHaveLength(2);

  const updatedRow = screen.getByRole("row", { name: /Third preparatory updated/ });
  await user.click(within(updatedRow).getByRole("button", { name: "Disable" }));
  await user.click(await screen.findByRole("button", { name: "Save" }));
  expect(await within(updatedRow).findByText("Disabled")).toBeTruthy();
});

it("keeps a duplicate track form open and shows a safe request error", async () => {
  const user = userEvent.setup();
  nodeServer.use(
    http.post(`${API_BASE_URL}/academic/tracks`, () =>
      HttpResponse.json(
        { error: { code: "DUPLICATE_TRACK", message: "private detail" } },
        {
          status: 409,
        },
      ),
    ),
  );
  renderPage(<AcademicPage />);
  await user.click(await screen.findByRole("button", { name: "Add track" }));
  const stage = screen.getByRole("combobox", { name: "Stage" });
  fireEvent.keyDown(stage, { key: "ArrowDown" });
  await user.keyboard("{ArrowDown}{Enter}");
  await user.type(screen.getByRole("textbox", { name: "Name" }), "First secondary");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByRole("dialog")).toBeTruthy();
  expect(screen.queryByText("private detail")).toBeNull();
  expect(
    await screen.findByText("A track already exists for this system, stage, and grade."),
  ).toBeTruthy();
});

it("creates, edits, and disables a subject through the page", async () => {
  const user = userEvent.setup();
  renderPage(<AcademicPage />);
  await user.click(await screen.findByRole("tab", { name: "Subjects" }));

  await user.click(await screen.findByRole("button", { name: "Add subject" }));
  await user.type(screen.getByRole("textbox", { name: "Name" }), "Biology");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findAllByText("Biology")).toHaveLength(2);

  const subjectRow = screen.getByRole("row", { name: /Biology/ });
  await user.click(within(subjectRow).getByRole("button", { name: "Edit" }));
  const nameField = screen.getByRole("textbox", { name: "Name" });
  await user.clear(nameField);
  await user.type(nameField, "Biology updated");
  await user.click(screen.getByRole("button", { name: "Save" }));
  const updatedRow = screen.getByRole("row", { name: /Biology updated/ });
  await user.click(within(updatedRow).getByRole("button", { name: "Disable" }));
  await user.click(await screen.findByRole("button", { name: "Save" }));
  expect(await within(updatedRow).findByText("Disabled")).toBeTruthy();
});
