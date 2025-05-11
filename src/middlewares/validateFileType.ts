import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import fileTypes from "../../fileTypes.json";

export const ALLOWED_TYPES = fileTypes.map(({ mimeType }) => mimeType);

export const validateFileType = zValidator(
	"form",
	z.object({
		file: z
			.instanceof(File)
			.refine((file) => ALLOWED_TYPES.includes(file.type), {
				message: "Invalid file type",
			}),
	}),
	async ({ success }, c) => {
		if (!success) {
			return c.json({ message: "Invalid file type" }, 400);
		}
	},
);
