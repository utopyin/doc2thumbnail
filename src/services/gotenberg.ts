import { BunFile } from "bun";
import { err, ok } from "neverthrow";

export const gotenberg = (url: string) => {
	return async (file: File | BunFile) => {
		const formData = new FormData();
		formData.append("files", file);
		formData.append("singlePageSheets", "true");

		const response = await fetch(`${url}/forms/libreoffice/convert`, {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			return err({ message: "Failed to convert file to .PDF" });
		}

		const blob = await response.blob();
		return ok({ pdf: blob });
	};
};
