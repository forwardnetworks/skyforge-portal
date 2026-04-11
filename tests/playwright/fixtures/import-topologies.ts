import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
const SERVER_IMPORT_FIXTURES_DIR = path.resolve(
	THIS_DIR,
	"../../../../server/skyforge/testdata/lab_designer_import",
);

function readFixture(name: string): string {
	return readFileSync(path.join(SERVER_IMPORT_FIXTURES_DIR, name), "utf8");
}

const containerlabMinimal = readFixture("containerlab_minimal.yaml");

export const IMPORT_TOPOLOGY_FIXTURES = {
	containerlabMinimal,
	containerlabDeploy: containerlabMinimal.replace(
		"name: clab-smoke",
		"name: clab-deploy-smoke",
	),
	eveMinimal: readFixture("eve_minimal.xml"),
	gns3Minimal: readFixture("gns3_minimal.yaml"),
	gns3JsonMinimal: readFixture("gns3_minimal.json"),
} as const;
