export function DangerousHtmlViolation() {
  return <div dangerouslySetInnerHTML={{ __html: "unsafe" }} />;
}
