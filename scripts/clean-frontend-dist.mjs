import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const canonicalOutDir = path.resolve(
	root,
	"../skyforge-server/skyforge/frontend_dist",
);

fs.rmSync(canonicalOutDir, { recursive: true, force: true });
