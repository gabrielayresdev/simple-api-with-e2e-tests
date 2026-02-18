import { FastifyInstance } from "fastify";
import MealController from "../controllers/meal";

export async function mealRoutes(app: FastifyInstance) {
  app.get("/meals", MealController.getAll);
  app.get("/meal/:id", MealController.getById);
  app.post("/meal", MealController.create);
  app.put("/meal/:id", MealController.update);
  app.patch("/meal/:id", MealController.patch);
  app.delete("/meal/:id", MealController.delete);
}
