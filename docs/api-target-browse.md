# Target student browse API

This document defines the frontend target contract. Live mode normalizes the current service through `packages/api`; pages consume only target types. The browser never decides lesson availability and never calculates prices.

## Teachers

`GET /teachers` requires a student session. Query parameters are `page`, `pageSize`, `trackId` (or `system` and `grade`), `subjectId`, `minRating`, `hasFreeLessons`, `q`, and `sort` (`rating | newest | priceAsc | priceDesc`).

```json
{
  "items": [
    {
      "id": "teacher-123",
      "name": "Teacher name",
      "photoUrl": "https://images.example/teacher.jpg",
      "bioExcerpt": "Short introduction",
      "subjects": [{ "id": "subject-123", "name": "Mathematics" }],
      "ratingAverage": 4.7,
      "ratingCount": 18,
      "startingPrice": 12000,
      "hasFreeLessons": true
    }
  ],
  "page": 1,
  "pageSize": 12,
  "total": 1,
  "serverNow": "2026-11-26T10:00:00.000Z"
}
```

`ratingAverage` is `null` until at least three ratings exist. `startingPrice` is a server-provided integer EGP amount and may be `null`. The server owns filtering, sorting, pagination, and price values.

## Teacher detail

`GET /teachers/:teacherId` requires a student session and returns the teacher profile plus courses matching the student's track. Each course contains its subject and track, lesson previews, and products. Lesson previews contain title, UTC `availableFrom` and `availableUntil`, server-computed availability (`upcoming | available | ended`), and access (`free | paid`). They never contain video URLs or player data.

Products contain a lesson or bundle identifier and an authoritative pricing preview: `priceNow`, `announcedCount`, optional `remainingCount`, and `purchasable`. `serverNow` accompanies every response containing lesson availability. The UI formats values without deriving availability from the local clock or calculating prices.

The backend returns `TEACHER_NOT_FOUND` (404), `TRACK_REQUIRED` (400), and `FORBIDDEN` (403) using the standard error envelope.

## Capability behavior

Mock mode implements the target shape. Live mode currently disables student-track filtering, ratings, starting price, lesson availability, course previews, and extended filters. The UI shows an explanatory state where data is absent, retains manual track choice in the URL, and never substitutes locally computed prices or availability. Capabilities may be enabled only after the live backend provides the matching contract.
