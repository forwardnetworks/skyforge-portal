import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, "..", "public", "docs");
const indexPath = path.join(docsDir, "index.html");

const START = "<!-- DOCS-LIST-START -->";
const END = "<!-- DOCS-LIST-END -->";

function titleFromFilename(filename) {
	const base = filename.replace(/\.html$/i, "");
	if (base.toLowerCase() === "index") return "Docs";
	const special = {
		servicenow: "ServiceNow",
	};
	if (special[base.toLowerCase()]) return special[base.toLowerCase()];
	return base.replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function listDocs() {
	const entries = fs.readdirSync(docsDir, { withFileTypes: true });
	return entries
		.filter((e) => e.isFile())
		.map((e) => e.name)
		.filter((n) => n.toLowerCase().endsWith(".html"))
		.filter((n) => n.toLowerCase() !== "index.html")
		.sort((a, b) => a.localeCompare(b));
}

function renderLinks(files) {
	const links = files.map((f) => {
		const title = titleFromFilename(f);
		return `        <a class="pill" href="/docs/${f}">${title}</a>`;
	});
	return [
		`      <div class="links" style="margin-top: 0.75rem">`,
		...links,
		`      </div>`,
	].join("\n");
}

function main() {
	const indexHtml = fs.readFileSync(indexPath, "utf8");
	if (!indexHtml.includes(START) || !indexHtml.includes(END)) {
		throw new Error(
			`docs index is missing markers; expected ${START} and ${END} in ${indexPath}`,
		);
	}

	const files = listDocs();
	const block = renderLinks(files);

	const before = indexHtml.split(START)[0];
	const after = indexHtml.split(END)[1];
	const next = `${before}${START}\n${block}\n      ${END}${after}`;

	if (next !== indexHtml) {
		fs.writeFileSync(indexPath, next, "utf8");
	}
}

main();
