import fs from "node:fs";
import path from "node:path";

function copyDir(src, dest) {
	if (!fs.existsSync(src)) {
		throw new Error(`source dir does not exist: ${src}`);
	}
	// Always replace the destination tree so hashed assets from prior builds
	// cannot accumulate and shadow current entrypoints.
	fs.rmSync(dest, { recursive: true, force: true });
	fs.mkdirSync(dest, { recursive: true });
	fs.cpSync(src, dest, { recursive: true, force: true });
}

// Canonical output (vite.config.ts outDir).
const root = process.cwd();
const canonicalOutDir = path.resolve(
	root,
	"../skyforge-server/skyforge/frontend_dist",
);

// Keep legacy/alternate code layouts in sync so local builds always work,
// regardless of which server tree is used to build images.
const targets = [
	path.resolve(root, "../skyforge/components/server/skyforge/frontend_dist"),
	path.resolve(root, "../server/skyforge/frontend_dist"),
];

for (const dest of targets) {
	try {
		// Avoid accidentally creating a bogus tree when this repo is checked out as a
		// submodule (e.g. skyforge/components/portal). In that layout, the
		// "../skyforge/components/..." target would expand to
		// "skyforge/components/skyforge/components/...", which should never be created.
		if (!fs.existsSync(path.dirname(dest))) {
			// eslint-disable-next-line no-console
			console.warn(`skip sync to ${dest}: parent dir does not exist`);
			continue;
		}
		copyDir(canonicalOutDir, dest);
		// eslint-disable-next-line no-console
		console.log(`synced frontend_dist -> ${dest}`);
	} catch (err) {
		// eslint-disable-next-line no-console
		console.warn(`skip sync to ${dest}: ${String(err?.message ?? err)}`);
	}
}
