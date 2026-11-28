export function DangerousFunctionViolation() {
  return new Function("return 1")();
}
