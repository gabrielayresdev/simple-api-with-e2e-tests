import fastify from "fastify";
import { mealRoutes } from "./routes/routes";

const app = fastify();

app.register(mealRoutes);

export { app };
