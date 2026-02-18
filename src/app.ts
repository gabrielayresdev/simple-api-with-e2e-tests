import fastify from "fastify";
import { mealRoutes } from "./routes/routes";
import cookie from "@fastify/cookie";

const app = fastify();

app.register(cookie);

app.register(mealRoutes);

export { app };
