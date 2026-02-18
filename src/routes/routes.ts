import { FastifyInstance } from "fastify";
import MealController from "../controllers/meal";

export async function mealRoutes(app: FastifyInstance) {
  app.post("/meal", MealController.create);
  app.put("/meal/:id", MealController.update);
  app.patch("/meal/:id", MealController.patch);
}
