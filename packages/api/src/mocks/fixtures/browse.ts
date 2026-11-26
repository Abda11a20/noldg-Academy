import type { BrowseTeacherDetail } from "../../contracts/browse";

const TRACKS = [
  {
    id: "track-secondary-1",
    name: "First Secondary",
    system: "general",
    stage: "secondary",
    grade: 1,
  },
  {
    id: "track-general-secondary-2",
    name: "Second Secondary",
    system: "general",
    stage: "secondary",
    grade: 2,
  },
  {
    id: "track-general-prep-3",
    name: "Third Preparatory",
    system: "general",
    stage: "prep",
    grade: 3,
  },
  {
    id: "track-azhar-secondary-1",
    name: "First Secondary",
    system: "azhar",
    stage: "secondary",
    grade: 1,
  },
] as const;

const SUBJECTS = [
  { id: "subject-math", name: "Mathematics", nameAr: "الرياضيات" },
  { id: "subject-arabic", name: "Arabic", nameAr: "اللغة العربية" },
  { id: "subject-physics", name: "Physics", nameAr: "الفيزياء" },
  { id: "subject-chemistry", name: "Chemistry", nameAr: "الكيمياء" },
  { id: "subject-english", name: "English", nameAr: "اللغة الإنجليزية" },
  { id: "subject-biology", name: "Biology", nameAr: "الأحياء" },
] as const;

const TEACHER_NAMES = [
  ["Ahmed Hassan", "أحمد حسن"],
  ["Mona Adel", "منى عادل"],
  ["Omar Ibrahim", "عمر إبراهيم"],
  ["Salma Mahmoud", "سلمى محمود"],
  ["Youssef Ali", "يوسف علي"],
  ["Nour Samir", "نور سمير"],
  ["Khaled Mostafa", "خالد مصطفى"],
  ["Farah Tarek", "فرح طارق"],
  ["Amr Nabil", "عمرو نبيل"],
  ["Dina Hany", "دينا هاني"],
  ["Karim Fawzy", "كريم فوزي"],
  ["Hana Sherif", "هناء شريف"],
] as const;

const BIO = "Clear explanations, guided practice, and steady progress for every student.";
const ARABIC_BIO = "شرح واضح وتدريب موجه وخطوات ثابتة لدعم تقدم كل طالب.";
const BASE_DATE = "2026-11-25T10:00:00.000Z";
const WINDOW_START = "2026-11-26T10:00:00.000Z";
const WINDOW_END = "2027-12-26T10:00:00.000Z";
const PAST_START = "2026-11-20T10:00:00.000Z";
const ENDED_END = "2026-11-24T10:00:00.000Z";
const PHOTO_URL = "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg";

function availabilityFor(index: number): "upcoming" | "available" | "ended" {
  return index % 3 === 0 ? "upcoming" : index % 3 === 1 ? "available" : "ended";
}

function priceFor(index: number): number {
  return 90 + index * 10;
}

function getWindow(availability: "upcoming" | "available" | "ended") {
  return {
    start: availability === "upcoming" ? WINDOW_START : PAST_START,
    end: availability === "ended" ? ENDED_END : WINDOW_END,
  };
}

/** Supplies deterministic mixed-language teacher browse scenarios for mock mode. */
export const MOCK_BROWSE_TEACHERS: BrowseTeacherDetail[] = TEACHER_NAMES.map(
  ([name, nameAr], index) => {
    const track = TRACKS[index % TRACKS.length]!;
    const subject = SUBJECTS[index % SUBJECTS.length]!;
    const id = `browse-teacher-${index + 1}`;
    const availability = availabilityFor(index);
    const window = getWindow(availability);
    const free = index % 2 === 0;
    const lessonId = `browse-lesson-${index + 1}`;
    const productId = `browse-product-${index + 1}`;
    const productName = `${subject.name} lesson`;
    return {
      id,
      name,
      nameAr,
      photoUrl: index % 4 === 0 ? null : PHOTO_URL,
      bioExcerpt: BIO,
      bioExcerptAr: ARABIC_BIO,
      subjects: [subject],
      ratingAverage: index % 4 === 1 ? null : 3.5 + (index % 3) / 2,
      ratingCount: index % 4 === 1 ? 0 : index + 3,
      startingPrice: index % 4 === 2 ? null : priceFor(index),
      hasFreeLessons: free,
      createdAt: BASE_DATE,
      bio: ARABIC_BIO,
      bioAr: ARABIC_BIO,
      serverNow: "2026-11-26T05:00:00.000Z",
      courses: [
        {
          id: `browse-course-${index + 1}`,
          subject,
          track,
          lessons: [
            {
              id: lessonId,
              title: productName,
              availableFrom: window.start,
              availableUntil: window.end,
              availability,
              access: free ? "free" : "paid",
            },
          ],
          products: [
            {
              id: productId,
              name: productName,
              kind: "lesson",
              lessonId,
              pricing: {
                priceNow: priceFor(index),
                announcedCount: 1,
                ...(index % 3 === 0 ? {} : { remainingCount: Math.max(0, 4 - (index % 4)) }),
                purchasable: index % 5 !== 0,
              },
            },
            {
              id: `browse-bundle-${index + 1}`,
              name: `${subject.name} bundle`,
              kind: "bundle",
              pricing: {
                priceNow: 250 + index * 15,
                announcedCount: 5,
                remainingCount: Math.max(0, 5 - (index % 6)),
                purchasable: true,
              },
            },
          ],
        },
      ],
    } satisfies BrowseTeacherDetail;
  },
);
