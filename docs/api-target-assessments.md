# Target API: questions and assessments

This document is the frontend target contract for the backend team. The current frontend adapter may support less than this target while the existing backend routes are in use. All ownership, eligibility, timing, attempt limits, frozen copies, and grading decisions remain server-authoritative.

## Questions

### Question model

```json
{
  "id": "question-id",
  "text": "Which value is even?",
  "imageUrl": "https://cdn.example.test/question.png",
  "options": [{ "text": "3" }, { "text": "4", "imageUrl": "https://cdn.example.test/option.png" }],
  "correctIndex": 1,
  "explanation": "4 is divisible by 2.",
  "subjectId": "subject-id",
  "lessonId": "lesson-id",
  "difficulty": "easy",
  "status": "active"
}
```

Only single-answer multiple-choice questions are supported in the target. There are 2–5 distinct non-empty options and exactly one valid zero-based `correctIndex`. Questions may be archived and restored. A question used by an assessment cannot be hard-deleted; editing it does not mutate frozen attempt copies.

### Routes

| Method | Route                            | Purpose               | Request                                                                              | Response                         |
| ------ | -------------------------------- | --------------------- | ------------------------------------------------------------------------------------ | -------------------------------- |
| GET    | `/questions/my`                  | Teacher question bank | `page`, `pageSize`, `subjectId`, `lessonId`, `difficulty`, `status`, `q`, `courseId` | `{items, page, pageSize, total}` |
| POST   | `/questions`                     | Create a question     | Question fields except `id`                                                          | `201` question                   |
| GET    | `/questions/:questionId`         | Read one question     | —                                                                                    | Question with usage state        |
| PATCH  | `/questions/:questionId`         | Edit a question       | Partial question fields                                                              | Updated question                 |
| POST   | `/questions/:questionId/archive` | Archive               | —                                                                                    | Updated question                 |
| POST   | `/questions/:questionId/restore` | Restore               | —                                                                                    | Updated question                 |

## Assessments

An assessment has `type` (`quiz`, `homework`, `exam`), `courseId`, `title`, `status` (`draft`, `published`, `closed`, `archived`), ordered `questionIds`, optional `randomCount`, `shuffle` (default `true`), `showResults` (`immediate` or `after_close`), optional `maxTabLeaves`, audience mode (`all_course_students` or `selected_students`) and `studentIds`.

Exam requires a Cairo-entered start/end window converted by the shared time module to ISO UTC, a positive `durationMinutes`, and teacher-selected `maxAttempts`. Homework has a day-based start/end, no duration, and one attempt. Quiz belongs to one lesson, has no independent window or duration, allows one attempt, and unlocks according to the server's watch threshold setting (default 75%). `randomCount` cannot exceed the available question pool. Targeting selected students requires at least one valid student from the course.

After the first attempt, question content, duration, and attempt limit are locked; the window end may only be extended. The attempt deadline is decided by the server as the nearer of start plus duration and the window end. There is no retake endpoint; a teacher can create a new assessment for a selected student. The frontend displays server state and never computes scores, suspicion, eligibility, or deadlines.

### Routes

| Method | Route                                            | Purpose                  | Request                                                      | Response                                                                   |
| ------ | ------------------------------------------------ | ------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| GET    | `/assessments/my`                                | Teacher assessment list  | `page`, `pageSize`, `courseId`, `lessonId`, `type`, `status` | `{items, page, pageSize, total}`                                           |
| GET    | `/assessments/courses/:courseId`                 | Course assessments       | —                                                            | Assessment list                                                            |
| POST   | `/assessments`                                   | Create draft             | Target assessment fields                                     | `201` assessment                                                           |
| GET    | `/assessments/:assessmentId`                     | Assessment detail        | —                                                            | Assessment including question snapshot data for teacher                    |
| PATCH  | `/assessments/:assessmentId`                     | Update draft             | Partial editable fields                                      | Updated assessment                                                         |
| PATCH  | `/assessments/:assessmentId/publish`             | Publish                  | —                                                            | Updated assessment                                                         |
| PATCH  | `/assessments/:assessmentId/close`               | Close                    | —                                                            | Updated assessment                                                         |
| GET    | `/assessments/:assessmentId/attempts`            | Teacher results          | `page`, `pageSize`, search, suspicious filter                | `{items, page, pageSize, total, summary?}` with server score and suspicion |
| GET    | `/assessments/:assessmentId/attempts/:attemptId` | Frozen attempt detail    | —                                                            | Frozen questions, student answers, correct answers                         |
| GET    | `/assessments/:assessmentId/my-attempt`          | Student's latest attempt | —                                                            | Student-safe attempt data                                                  |

Attempt results contain student, score, total, start/submission time, submit reason (`manual` or `auto`), tab leaves, and server-computed `suspicious`. The optional `summary` contains server-computed average score, manual and automatic submission counts, and suspicious count; the frontend does not derive these metrics. Detail questions are the frozen copies used for that attempt.

### Error codes

`ASSESSMENT_LOCKED`, `ASSESSMENT_WINDOW_INVALID`, `POOL_TOO_SMALL`, `NO_QUESTIONS`, `QUESTION_INVALID`, `QUESTION_IN_USE`, and `TARGET_STUDENT_INVALID` are normalized to the frontend error model. Unknown server messages are not displayed directly.

## Current backend compatibility

The existing API uses legacy `data` and `pagination` envelopes, `page/limit`, and Joi schemas. It supports single choice, multiple choice, true/false and essay questions. It has no image, explanation, subject/lesson association, difficulty, archive status, audience targeting, shuffle/random pool, delayed result setting, tab-leave limit, assessment archive, or assessment-nested result routes. A paginated attempt list exists at `GET /api/attempts?assessmentId=...`, and individual attempts at `GET /api/attempts/:attemptId`. Its quiz threshold is stored on the assessment (default 100 in the current model), not read from a platform setting. Legacy essay and multiple-answer questions remain read-only unsupported entries in the target UI and cannot be selected for target assessments.

These differences are verified in `docs/contract-differences.md`; live-mode capability flags keep unsupported controls unavailable. The API continues to enforce permissions and all business rules.
