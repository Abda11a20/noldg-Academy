import type { AcademicSubject, AcademicTrack, TeacherApplication } from "../../contracts/admin";

export const MOCK_TRACKS: AcademicTrack[] = [
  {
    id: "track-1",
    system: "general",
    stage: "secondary",
    grade: 1,
    name: "First secondary",
    active: true,
  },
  {
    id: "track-2",
    system: "azhar",
    stage: "prep",
    grade: 2,
    name: "Second preparatory",
    active: true,
  },
];
export const MOCK_SUBJECTS: AcademicSubject[] = [
  { id: "subject-1", name: "Mathematics", active: true },
  { id: "subject-2", name: "Physics", active: true },
];
export const MOCK_APPLICATIONS: TeacherApplication[] = [
  {
    id: "application-1",
    userId: {
      id: "teacher-id",
      name: "Salma Hassan",
      email: "teacher-pending@example.test",
      phone: "+201000000001",
    },
    name: "Salma Hassan",
    email: "teacher-pending@example.test",
    phone: "+201000000001",
    bio: "Experienced mathematics teacher",
    status: "pending",
    submittedAt: "2026-11-20T12:00:00.000Z",
    offerings: [
      {
        trackId: "track-1",
        subjectId: "subject-1",
        track: MOCK_TRACKS[0],
        subject: MOCK_SUBJECTS[0],
      },
    ],
  },
];
