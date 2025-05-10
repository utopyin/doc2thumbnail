import { createMiddleware } from "hono/factory";
import { z } from "zod";

export const zEnv = z.object({
	testtt: z.coerce.number(),
});

export const loadEnv = createMiddleware(async (c, next) => {
	const env = zEnv.safeParse(process.env);
	if (!env.success) {
		console.error(env.error);
		throw new Error("Invalid environment variables");
	}
	c.env = env.data;
	await next();
});
