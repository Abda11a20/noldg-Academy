import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const distributionDirectory = "apps/portal/dist";
const galleryMarker = "noldg-academy-ui-gallery-dev-only";

/** Recursively checks production output for the development gallery marker. */
async function containsGalleryMarker(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (await containsGalleryMarker(entryPath)) return true;
      continue;
    }
    if ((await readFile(entryPath)).includes(galleryMarker)) return true;
  }
  return false;
}

if (await containsGalleryMarker(distributionDirectory)) {
  globalThis.process.stderr.write("The production output contains the UI gallery marker.\n");
  globalThis.process.exitCode = 1;
} else {
  globalThis.process.stdout.write("No development UI gallery marker found in production output.\n");
}
