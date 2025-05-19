import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { validateFileType } from "../middlewares/validateFileType";
import { queue } from "../services/queue";

export const authenticatedRoutes = new Hono()
	.post(
		"/thumbnail",
		validateFileType,
		zValidator("query", z.object({ webhook: z.string().url() })),
		async (c) => {
			const { file } = c.req.valid("form");
			const { webhook } = c.req.valid("query");

			const jobId = crypto.randomUUID();
			const fileName = `files/${jobId}${file.name}`;

			await Bun.write(fileName, file);

			await queue.add(fileName, { fileName, webhook }, { jobId });

			return c.json({ jobId });
		},
	)
	.get("/thumbnail/:jobId", async (c) => {
		const { jobId } = c.req.param();
		const job = await queue.getJob(jobId);

		if (!job) {
			return c.json({ error: "Job not found" }, 404);
		}

		return c.json({
			jobId,
			progress: job.progress,
			isWaiting: await job.isWaiting(),
			isActive: await job.isActive(),
			isCompleted: await job.isCompleted(),
			isFailed: await job.isFailed(),
			isDelayed: await job.isDelayed(),
		});
	});
