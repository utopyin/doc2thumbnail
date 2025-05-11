import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { Result, err, ok } from "neverthrow";
import { fromBuffer } from "pdf2pic";
import { ENV } from "../middlewares/loadEnv";
import { gotenberg } from "./gotenberg";

export const QUEUE_NAME = "pdf-thumbnail";

const connection = new Redis(ENV.REDIS_URL, { maxRetriesPerRequest: null });

type DataType = { fileName: string; webhook: string };
type ResultType = Result<Buffer, { message: string }>;

export const queue = new Queue<DataType, ResultType>(QUEUE_NAME, {
	connection,
});

const worker = new Worker<DataType, ResultType>(
	QUEUE_NAME,
	async (job) => {
		const { fileName } = job.data;
		const file = Bun.file(fileName);

		const result = await gotenberg(ENV.GOTENBERG_URL)(file);

		if (result.isErr()) {
			return err(result.error);
		}

		job.updateProgress(50);

		const pdfBuffer = await result.value.pdf.arrayBuffer();
		const convert = fromBuffer(Buffer.from(pdfBuffer), {
			preserveAspectRatio: true,
			width: 1000,
			format: "jpeg",
		});

		const { buffer } = await convert(1, { responseType: "buffer" });
		if (!buffer) {
			return err({ message: "Failed to convert PDF to image" });
		}

		job.updateProgress(100);

		return ok(buffer);
	},
	{
		connection,
	},
);

worker.on("progress", (job, progress) => {
	console.log(`Job ${job.name} is ${progress}% done`);
});

worker.on("completed", async (job, result) => {
	if (result.isErr()) {
		console.error(`Job ${job.name} failed with error: ${result.error.message}`);
		return;
	}

	await Bun.file(job.data.fileName).delete();

	const image = result.value;

	await fetch(job.data.webhook, {
		method: "POST",
		body: new Uint8Array(image),
		headers: {
			"Content-Type": "image/jpeg",
		},
	});

	console.log(
		`Job ${job.name} completed with image of ${image.byteLength} bytes`,
	);
});

worker.on("error", (err) => {
	console.error(err);
});
