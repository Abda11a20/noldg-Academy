import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { API_BASE_URL } from "@noldg/api/constants/http";
import type { Question } from "@noldg/api/contracts/assessments";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import i18n from "../../../shared/i18n";
import { loadRouteNamespace } from "../../../shared/i18n/load-route-namespace";
import { renderPage } from "../../../shared/testing/render-page";
import { MOCK_QUESTIONS } from "@noldg/api/mocks/fixtures/assessments";
import { QuestionBankPage } from "./QuestionBankPage";

const question = MOCK_QUESTIONS[0] as Question;

beforeEach(async () => {
  await Promise.all([i18n.changeLanguage("en"), loadRouteNamespace("questions")]);
});
afterEach(cleanup);

function installList(items: unknown[] = [question]) {
  nodeServer.use(
    http.get(`${API_BASE_URL}/questions/my`, () =>
      HttpResponse.json({ items, page: 1, pageSize: 20, total: items.length }),
    ),
  );
}

describe("question bank page", () => {
  it.each([
    ["empty", 200, { items: [], page: 1, pageSize: 20, total: 0 }, "No questions in this view"],
    [
      "forbidden",
      403,
      { error: { code: "FORBIDDEN" } },
      "You do not have permission to view the question bank.",
    ],
    [
      "server failure",
      503,
      { error: { code: "SERVER_ERROR" } },
      "Question bank could not be loaded",
    ],
  ])("shows the %s state", async (_name, status, body, expected) => {
    nodeServer.use(
      http.get(`${API_BASE_URL}/questions/my`, () =>
        HttpResponse.json(body, { status: Number(status) }),
      ),
    );
    renderPage(<QuestionBankPage />);
    if (Number(status) === 503) {
      expect((await screen.findByRole("alert")).textContent).toContain(String(expected));
      return;
    }
    expect((await screen.findAllByText(String(expected))).length).toBeGreaterThan(0);
  });

  it("restores and updates URL filters through the list endpoint", async () => {
    let requestedDifficulty = "";
    let requestedSubjectId = "";
    nodeServer.use(
      http.get(`${API_BASE_URL}/questions/my`, ({ request }) => {
        requestedDifficulty = new URL(request.url).searchParams.get("difficulty") ?? "";
        requestedSubjectId = new URL(request.url).searchParams.get("subjectId") ?? "";
        return HttpResponse.json({ items: [question], page: 1, pageSize: 20, total: 1 });
      }),
    );
    const filters = encodeURIComponent(JSON.stringify({ difficulty: "easy" }));
    renderPage(<QuestionBankPage />, undefined, [`/teacher/questions?filters=${filters}`]);
    expect((await screen.findAllByText(question.text)).length).toBeGreaterThan(0);
    await waitFor(() => expect(requestedDifficulty).toBe("easy"));
    expect(screen.getByLabelText("Difficulty").textContent).toContain("Easy");
    fireEvent.change(screen.getByLabelText("Subject ID"), { target: { value: "subject-9" } });
    await waitFor(() => expect(requestedSubjectId).toBe("subject-9"));
    fireEvent.change(screen.getByLabelText("Subject ID"), { target: { value: "" } });
    await waitFor(() => expect(requestedSubjectId).toBe(""));
  });

  it("keeps unsupported legacy questions read-only", async () => {
    installList([
      {
        id: "legacy-essay",
        text: "Explain the concept",
        legacyType: "essay",
        options: [],
        supported: false,
      },
    ]);
    renderPage(<QuestionBankPage />);
    expect(
      (await screen.findAllByText("Unsupported legacy type: essay — read only")).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Edit question" })).toBeNull();
  });

  it("validates duplicate options before submitting", async () => {
    installList([]);
    renderPage(<QuestionBankPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Add question" }));
    fireEvent.change(screen.getByLabelText("Question text"), { target: { value: "A question?" } });
    fireEvent.change(screen.getByLabelText("Option 1"), { target: { value: "Same" } });
    fireEvent.change(screen.getByLabelText("Option 2"), { target: { value: "Same" } });
    fireEvent.click(screen.getByRole("button", { name: "Save question" }));
    expect(
      await screen.findByText("Check the question text, options, and correct answer."),
    ).toBeTruthy();
  });

  it("adds and removes options while keeping the minimum intact", async () => {
    installList([]);
    renderPage(<QuestionBankPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Add question" }));
    fireEvent.click(screen.getByRole("button", { name: "Add option" }));
    expect(screen.getByLabelText("Option 3")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove option 3" }));
    expect(screen.queryByLabelText("Option 3")).toBeNull();
    expect(screen.getByRole("button", { name: "Remove option 1" }).hasAttribute("disabled")).toBe(
      true,
    );
  });

  it("creates a validated MCQ and previews its answer", async () => {
    let submitted: unknown;
    nodeServer.use(
      http.get(`${API_BASE_URL}/questions/my`, () =>
        HttpResponse.json({ items: [question], page: 1, pageSize: 20, total: 1 }),
      ),
      http.post(`${API_BASE_URL}/questions`, async ({ request }) => {
        submitted = await request.json();
        return HttpResponse.json(
          { ...question, ...(submitted as object), id: "created-question" },
          { status: 201 },
        );
      }),
    );
    renderPage(<QuestionBankPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Add question" }));
    fireEvent.change(screen.getByLabelText("Question text"), {
      target: { value: "What is 2 + 2?" },
    });
    fireEvent.change(screen.getByLabelText("Option 1"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Option 2"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save question" }));
    await waitFor(() =>
      expect(submitted).toMatchObject({
        type: "multiple_choice",
        text: "What is 2 + 2?",
        options: [{ text: "4" }, { text: "5" }],
        correctIndex: 0,
        status: "active",
      }),
    );
    fireEvent.click((await screen.findAllByRole("button", { name: "Preview question" }))[0]!);
    expect((await screen.findAllByText(question.text)).length).toBeGreaterThan(0);
    expect(screen.getByText("Correct answer")).toBeTruthy();
  });
});

describe("question bank mutations", () => {
  it("edits a used question while keeping prior attempts frozen", async () => {
    const usedQuestion = { ...question, used: true };
    let updated: unknown;
    nodeServer.use(
      http.get(`${API_BASE_URL}/questions/my`, () =>
        HttpResponse.json({ items: [usedQuestion], page: 1, pageSize: 20, total: 1 }),
      ),
      http.patch(`${API_BASE_URL}/questions/:id`, async ({ request }) => {
        updated = await request.json();
        return HttpResponse.json({ ...usedQuestion, ...(updated as object) });
      }),
    );
    renderPage(<QuestionBankPage />);
    fireEvent.click((await screen.findAllByRole("button", { name: "Edit question" }))[0]!);
    expect(
      await screen.findByText(
        "This question was used before; previous student attempts remain unchanged.",
      ),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Question text"), {
      target: { value: "Updated question text" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save question" }));
    await waitFor(() => expect(updated).toMatchObject({ text: "Updated question text" }));
    expect(await screen.findByText("Question changes saved.")).toBeTruthy();
  });

  it("archives and restores a question through confirmations", async () => {
    let status: Question["status"] = "active";
    nodeServer.use(
      http.get(`${API_BASE_URL}/questions/my`, () => {
        const item = { ...question, status };
        return HttpResponse.json({ items: [item], page: 1, pageSize: 20, total: 1 });
      }),
      http.post(`${API_BASE_URL}/questions/:id/:action`, ({ params }) => {
        status = params.action === "archive" ? "archived" : "active";
        return HttpResponse.json({ ...question, status });
      }),
    );
    renderPage(<QuestionBankPage />);
    fireEvent.click((await screen.findAllByRole("button", { name: "Archive question" }))[0]!);
    fireEvent.click(screen.getAllByRole("button", { name: "Archive question" }).at(-1)!);
    expect(await screen.findByText("Question archived.")).toBeTruthy();
    fireEvent.click((await screen.findAllByRole("button", { name: "Restore question" }))[0]!);
    fireEvent.click(screen.getAllByRole("button", { name: "Restore question" }).at(-1)!);
    expect(await screen.findByText("Question restored.")).toBeTruthy();
  });
});
