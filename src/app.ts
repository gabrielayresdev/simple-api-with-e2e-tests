import fastify from "fastify";
import { mealRoutes } from "./routes/routes";
import cookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";

const app = fastify();

app.register(cookie);

app.register(fastifyCors, { origin: "*" });

app.register(mealRoutes);

export { app };
