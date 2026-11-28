export function DangerousInnerHtmlViolation(element: HTMLElement) {
  element.innerHTML = "unsafe";
}
