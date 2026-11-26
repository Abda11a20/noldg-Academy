import { ErrorState, Heading } from "@noldg/ui";
import { LessonEditorContent } from "../components/LessonEditorContent";
import { useLessonEditorPageState } from "../hooks/useLessonEditorPageState";

/** Composes the lesson editor state with the presentation component. */
export function LessonEditorPage() {
  const state = useLessonEditorPageState();
  if (state.screen === "ready") return <LessonEditorContent {...state.editor} />;
  if (state.screen === "loading") return <Heading level={1}>{state.message}</Heading>;
  return <ErrorState title={state.message} description={state.message} />;
}
