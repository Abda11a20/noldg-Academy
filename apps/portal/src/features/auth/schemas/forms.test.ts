import { describe, expect, it } from "vitest";
import {
  AuthPasswordSchema,
  AuthUserSchema,
  LoginRequestSchema,
  StudentRegistrationRequestSchema,
  TeacherRegistrationRequestSchema,
} from "@noldg/api/contracts/auth";
import { normalizeArabicDigits } from "../../../shared/normalize-arabic-digits";
import { authDestinationForUser } from "../utils/routing";
import { sanitizeReturnTo } from "../utils/return-to";

const validPassword = `Aa1!${"x".repeat(68)}`;

describe("auth validation and navigation helpers", () => {
  it("accepts a password at the backend's 72-byte limit and rejects longer UTF-8 input", () => {
    expect(AuthPasswordSchema.safeParse(validPassword).success).toBe(true);
    expect(AuthPasswordSchema.safeParse(`${validPassword}x`).success).toBe(false);
    expect(AuthPasswordSchema.safeParse(`Aa1!${"ع".repeat(35)}`).success).toBe(false);
  });

  it("checks email and password before the login request", () => {
    expect(LoginRequestSchema.safeParse({ email: "invalid", password: "short" }).success).toBe(
      false,
    );
    expect(
      LoginRequestSchema.safeParse({ email: "mona@example.test", password: "Aa1!pass" }).success,
    ).toBe(true);
  });

  it("normalizes Arabic-Indic and Persian digits for phone and OTP inputs", () => {
    expect(normalizeArabicDigits("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹")).toBe("01234567890123456789");
  });

  it("rejects student terms that are not accepted and teacher applications without offerings or a File", () => {
    const student = {
      name: "Mona Ali",
      email: "mona@example.test",
      phone: "+201000000000",
      parentPhone: "+201000000001",
      password: "Aa1!pass",
      trackId: "track-id",
      acceptTerms: false,
    };
    expect(StudentRegistrationRequestSchema.safeParse(student).success).toBe(false);
    const teacher = {
      name: "Salma Hassan",
      email: "salma@example.test",
      phone: "+201000000000",
      password: "Aa1!pass",
      bio: "Teacher",
      offerings: [],
      image: "portrait.png",
      acceptTerms: true,
    };
    expect(TeacherRegistrationRequestSchema.safeParse(teacher).success).toBe(false);
    expect(
      TeacherRegistrationRequestSchema.safeParse({
        ...teacher,
        image: new File(["image"], "photo.png", { type: "image/png" }),
        offerings: [{ trackId: "track", subjectId: "subject" }],
      }).success,
    ).toBe(true);
  });

  it("rejects external return destinations and routes accounts by role and status", () => {
    expect(sanitizeReturnTo("//attacker.example/path")).toBeNull();
    expect(sanitizeReturnTo("https://attacker.example/path")).toBeNull();
    expect(sanitizeReturnTo("/student?tab=lessons")).toBe("/student?tab=lessons");
    const student = AuthUserSchema.parse({
      id: "student",
      name: "Mona",
      email: "mona@example.test",
      role: "student",
      status: "active",
      emailVerified: true,
    });
    const pendingTeacher = AuthUserSchema.parse({
      id: "teacher",
      name: "Salma",
      email: "salma@example.test",
      role: "teacher",
      status: "active",
      emailVerified: true,
      applicationStatus: "pending",
    });
    expect(authDestinationForUser(student)).toBe("/student");
    expect(authDestinationForUser(pendingTeacher)).toBe("/teacher/pending");
    expect(authDestinationForUser({ ...pendingTeacher, applicationStatus: "approved" })).toBe(
      "/teacher",
    );
    expect(authDestinationForUser({ ...student, role: "admin" })).toBe("/admin");
    expect(authDestinationForUser({ ...student, status: "suspended" })).toBe("/account-suspended");
  });
});
