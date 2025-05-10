import { Hono } from "hono";
import type { z } from "zod";
import { loadEnv, type zEnv } from "./middlewares/loadEnv";

const app = new Hono<{ Bindings: z.infer<typeof zEnv> }>();

app.use(loadEnv).get("/", (c) => {
	return c.text(c.env.testtt.toFixed(2));
});

export default app;
