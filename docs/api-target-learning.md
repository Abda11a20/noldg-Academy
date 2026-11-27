# Target learning API contract

This document defines the frontend target contract for student learning and playback. Availability, ownership, progress credit, prerequisite checks, and playback permissions are server decisions. The client sends playback position and rate only; it never claims watched progress.

All routes are relative to `/api`. List responses use `{ items, page, pageSize, total }`. Timestamps are ISO 8601 UTC. Errors use the normalized envelope `{ error: { code, message, details? } }`.

## Student lesson list

`GET /me/lessons?page=1&pageSize=20&availability=available&teacherId=...&courseId=...&q=...&sort=availableUntil`

Requires an authenticated student. The server filters by the student's access and returns server-owned availability and the server timestamp.

```json
{
  "items": [
    {
      "id": "lesson-id",
      "title": "Lesson title",
      "teacher": { "id": "teacher-id", "name": "Teacher name" },
      "course": { "id": "course-id", "name": "Mathematics" },
      "availableFrom": "2026-11-27T10:00:00.000Z",
      "availableUntil": "2026-12-27T10:00:00.000Z",
      "availability": "available",
      "serverNow": "2026-11-27T10:15:00.000Z",
      "access": "owned",
      "progress": { "watchedPercent": 35, "thresholdReached": false, "lastPositionSeconds": 42 },
      "attachments": [],
      "quiz": { "available": false },
      "prerequisiteLessonId": null
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1,
  "serverNow": "2026-11-27T10:15:00.000Z"
}
```

Allowed `availability`: `available | upcoming | ended`. Allowed `access`: `free | owned | not_owned`. Availability and access must be computed by the backend, not compared with the browser clock.

## Lesson detail and attachments

`GET /me/lessons/:lessonId` returns the fields above plus the description and `quiz: { available, id? }`. The response includes no video URL, source token, or player session. An unknown identifier returns `404 TEACHER_NOT_FOUND` or a lesson-specific `404` code agreed by the backend; access outside the student's track returns `403 FORBIDDEN`.

`GET /lessons/:lessonId/attachments/:attachmentId/download` returns `{ url, expiresAt }` with a short-lived URL. The UI requests it only after the student selects an attachment and does not put it in the URL, logs, or server-data cache.

## Playback

`POST /lessons/:lessonId/playback` starts the student's one active session. The backend checks lesson availability, ownership, prerequisites, active device, and any playback policy before returning a session.

```json
{
  "sessionId": "session-id",
  "source": {
    "method": "file",
    "url": "https://media.example/video",
    "expiresAt": "2026-11-27T11:00:00.000Z"
  },
  "startPositionSeconds": 42,
  "heartbeatIntervalSeconds": 10,
  "watermark": { "text": "Student name • masked phone" },
  "serverNow": "2026-11-27T10:15:00.000Z"
}
```

`source.method` is a discriminated union. `file` is implemented for the current provider. `hls` (`{ method: "hls", url, expiresAt }`) is reserved in the contract and is not implemented until the streaming provider is selected.

`POST /playback/:sessionId/heartbeat` accepts `{ sequence, positionSeconds, playbackRate }` and returns `{ watchedSeconds, watchedPercent, thresholdReached, nextHeartbeatInSeconds, serverNow }`. The backend credits watched time and determines `thresholdReached`. A client retry reuses the same sequence number. Starting another session closes/replaces the student's earlier active session.

`POST /playback/:sessionId/close` closes the session. The client also attempts a keepalive close on page hide and route exit. A close failure does not grant or revoke access; the server lease remains authoritative.

## Error codes

Target errors include `LESSON_NOT_AVAILABLE`, `LESSON_ENDED`, `LESSON_NOT_OWNED`, `PLAYBACK_SESSION_REPLACED`, `PLAYBACK_TOKEN_EXPIRED`, `HEARTBEAT_OUT_OF_ORDER`, and `PLAYBACK_RATE_REJECTED`. The frontend maps known backend codes in the API adapter; unknown failures become the central normalized request error.

## Current backend compatibility

The read-only backend currently exposes authenticated playback session start, heartbeat, close, and lesson progress under `/api/learning`. Lesson access returns a time-limited direct Cloudinary file URL at `/api/lessons/:lessonId/access?sessionId=...`. It has no `/me/lessons` list or student lesson detail route, no dedicated attachment download route, no HLS source, no session watermark, and no target `serverNow` heartbeat field. The live API therefore exposes the list/detail/attachment features as unavailable and adapts only confirmed playback/progress fields. A direct download URL remains a security limitation even though it is time-limited; the UI does not present it as protected streaming.
