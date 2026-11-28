import { buildWhatsappLink, normalizeEgyptianWhatsappNumber } from "./whatsapp";
import { describe, expect, it } from "vitest";

describe("WhatsApp link helpers", () => {
  it.each([
    "01012345678",
    "+201012345678",
    "00201012345678",
    "+2001012345678",
    "٠١٠١٢٣٤٥٦٧٨",
    "201012345678",
  ])("normalizes %s", (input) => {
    expect(normalizeEgyptianWhatsappNumber(input)).toBe("201012345678");
  });

  it.each(["", "12345", "011123456789", "+971501234567"])("rejects %s", (input) => {
    expect(normalizeEgyptianWhatsappNumber(input)).toBeNull();
  });

  it("encodes only the supplied localized message", () => {
    expect(buildWhatsappLink("01012345678", "Order ORD-7 & Algebra")).toBe(
      "https://wa.me/201012345678?text=Order%20ORD-7%20%26%20Algebra",
    );
  });
});
