export function confirmDeleteObject(key: string) {
	return window.confirm(`Delete ${key}?`);
}

export function promptFolderPrefix() {
	return window.prompt("Folder prefix (e.g. uploads/)");
}

export function openUploadFileDialog(onFileSelected: (file: File) => void) {
	const input = document.createElement("input");
	input.type = "file";
	input.onchange = () => {
		const file = input.files?.[0];
		if (!file) return;
		onFileSelected(file);
	};
	input.click();
}
