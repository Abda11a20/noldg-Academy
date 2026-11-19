import { describe, expect, it } from "vitest";
import {
  AuthPasswordSchema,
  LoginPasswordSchema,
  LoginRequestSchema,
  StudentRegistrationRequestSchema,
  TeacherRegistrationRequestSchema,
} from "./auth";

const validPassword = "Example!123";

describe("auth contract schemas", () => {
  it("accepts the backend password complexity and exact 72-byte boundary", () => {
    expect(AuthPasswordSchema.safeParse(validPassword).success).toBe(true);
    expect(AuthPasswordSchema.safeParse(`${validPassword}${"a".repeat(61)}`).success).toBe(true);
    expect(AuthPasswordSchema.safeParse(`${validPassword}${"a".repeat(62)}`).success).toBe(false);
    expect(LoginPasswordSchema.safeParse("legacy-pass").success).toBe(true);
  });

  it("validates target login and student registration fields", () => {
    expect(
      LoginRequestSchema.safeParse({ email: "student@example.test", password: validPassword })
        .success,
    ).toBe(true);
    expect(
      StudentRegistrationRequestSchema.safeParse({
        name: "Student",
        email: "student@example.test",
        phone: "+201001234567",
        parentPhone: "+201009876543",
        password: validPassword,
        trackId: "track-1",
        acceptTerms: true,
      }).success,
    ).toBe(true);
    expect(StudentRegistrationRequestSchema.safeParse({}).success).toBe(false);
  });

  it("requires at least one valid teacher offering and an image", () => {
    const base = {
      name: "Teacher",
      email: "teacher@example.test",
      phone: "+201001234567",
      password: validPassword,
      bio: "Experienced teacher",
      acceptTerms: true as const,
    };
    expect(TeacherRegistrationRequestSchema.safeParse({ ...base, offerings: [] }).success).toBe(
      false,
    );
    expect(
      TeacherRegistrationRequestSchema.safeParse({
        ...base,
        offerings: [{ trackId: "track-1", subjectId: "subject-1" }],
        image: new File(["image"], "profile.png", { type: "image/png" }),
      }).success,
    ).toBe(true);
  });
});
