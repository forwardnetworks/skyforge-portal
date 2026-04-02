export function promptFolderPrefix(currentPrefix = ""): string | null {
	const raw = window.prompt(
		"Folder prefix",
		currentPrefix ? `${currentPrefix}new-folder/` : "new-folder/",
	);
	if (raw === null) return null;
	const trimmed = raw.trim().replace(/^\/+/, "");
	if (!trimmed) return null;
	return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

export function confirmDeleteObject(key: string): boolean {
	return window.confirm(`Delete object?\n\n${key}`);
}

export function openUploadFileDialog(onSelect: (file: File) => void) {
	const input = document.createElement("input");
	input.type = "file";
	input.onchange = () => {
		const file = input.files?.[0];
		if (file) onSelect(file);
	};
	input.click();
}

