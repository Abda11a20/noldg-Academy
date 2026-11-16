# Static hosting security headers

`apps/portal/public/_headers` ships a restrictive Content Security Policy and baseline browser security headers. Replace the documented `https://API_ORIGIN` placeholder in the hosting configuration with the exact production API origin before deployment; the static headers format does not interpolate Vite environment variables. The policy allows local assets and the Cloudinary media host used by the verified current backend. It does not permit inline scripts or styles.
