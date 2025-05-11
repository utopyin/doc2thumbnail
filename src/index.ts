import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { logger } from "hono/logger";
import { ENV } from "./middlewares/loadEnv";
import { routes } from "./routes";

const app = new Hono()
	.use("*", logger())
	.use("/auth/*", (c, next) =>
		basicAuth({
			username: "user",
			password: ENV.PASSWORD,
		})(c, next),
	)
	.route("/", routes);

export default app;
