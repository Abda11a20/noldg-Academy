import type { AuthUser } from "../../contracts/auth";

export const AUTH_SCENARIO_EMAILS = {
  student: "student@example.test",
  teacher: "teacher-pending@example.test",
  approvedTeacher: "teacher-approved@example.test",
  rejectedTeacher: "teacher-rejected@example.test",
  admin: "admin@example.test",
  wrongPassword: "wrong-password@example.test",
  suspended: "suspended@example.test",
  deviceBlocked: "device-blocked@example.test",
  rateLimited: "rate-limited@example.test",
  emailTaken: "email-taken@example.test",
  phoneTaken: "+201000000000",
  networkFailure: "network-failure@example.test",
  sessionExpired: "expired-session@example.test",
} as const;

export const AUTH_OTP_SCENARIOS = {
  valid: "123456",
  invalid: "000000",
  expired: "111111",
  rateLimited: "222222",
} as const;

export const MOCK_ACCESS_TOKEN = "mock-auth-session-token";
export const MOCK_EXPIRED_ACCESS_TOKEN = "expired-mock-auth-session-token";

export const MOCK_AUTH_USERS: Readonly<Record<string, AuthUser>> = {
  [AUTH_SCENARIO_EMAILS.student]: {
    id: "student-id",
    name: "Mona Ali",
    role: "student",
    status: "active",
    email: AUTH_SCENARIO_EMAILS.student,
    emailVerified: true,
    trackId: "track-secondary-1",
  },
  [AUTH_SCENARIO_EMAILS.teacher]: {
    id: "teacher-id",
    name: "Salma Hassan",
    role: "teacher",
    status: "active",
    email: AUTH_SCENARIO_EMAILS.teacher,
    emailVerified: true,
    applicationStatus: "pending",
  },
  [AUTH_SCENARIO_EMAILS.approvedTeacher]: {
    id: "approved-teacher-id",
    name: "Ahmed Teacher",
    role: "teacher",
    status: "active",
    email: AUTH_SCENARIO_EMAILS.approvedTeacher,
    emailVerified: true,
    applicationStatus: "approved",
  },
  [AUTH_SCENARIO_EMAILS.rejectedTeacher]: {
    id: "rejected-teacher-id",
    name: "Omar Hassan",
    role: "teacher",
    status: "active",
    email: AUTH_SCENARIO_EMAILS.rejectedTeacher,
    emailVerified: true,
    applicationStatus: "rejected",
    rejectionReason: "Please add more teaching experience.",
  },
  [AUTH_SCENARIO_EMAILS.admin]: {
    id: "admin-id",
    name: "Admin User",
    role: "admin",
    status: "active",
    email: AUTH_SCENARIO_EMAILS.admin,
    emailVerified: true,
  },
};

export const MOCK_ACADEMIC_CATALOG = {
  systems: ["general", "al_azhar"],
  tracks: [
    {
      id: "track-secondary-1",
      name: "First Secondary",
      system: "general",
      stage: "secondary",
      grade: 1,
      subjects: [
        { id: "subject-arabic", name: "Arabic" },
        { id: "subject-mathematics", name: "Mathematics" },
      ],
    },
    {
      id: "track-secondary-2",
      name: "Second Secondary",
      system: "general",
      stage: "secondary",
      grade: 2,
      subjects: [{ id: "subject-physics", name: "Physics" }],
    },
  ],
} as const;
