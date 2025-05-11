import { Hono } from "hono";
import { Env } from "../";
import { authenticatedRoutes } from "./authed";

export const routes = new Hono<Env>().route("/auth", authenticatedRoutes);
