# Static hosting security headers

Production builds generate `apps/portal/dist/_headers` via `apps/portal/scripts/generate-headers.mjs` using public build-time environment variables:

- `VITE_API_ORIGIN` (required): exact production API origin without a path or query (`connect-src`).
- `VITE_UPLOAD_ORIGINS` (required): comma-separated HTTPS direct-upload origins (`connect-src` and `media-src`), e.g. `https://api.cloudinary.com` while Cloudinary is active.
- `VITE_IMAGE_ORIGINS` (required): comma-separated HTTPS remote image origins (`img-src`), e.g. `https://res.cloudinary.com`.
- `VITE_MEDIA_ORIGINS` (optional): comma-separated HTTPS media playback origins merged into `media-src`, e.g. `https://res.cloudinary.com` (temporary Cloudinary delivery) or future Bunny Stream / Cloudflare R2 origins.

The generated policy enforces strict script/style/object/frame restrictions (no inline scripts or styles), `upgrade-insecure-requests`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`, and `Permissions-Policy`.
