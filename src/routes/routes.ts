import { FastifyInstance } from "fastify";
import MealController from "../controllers/meal";
import UserController from "../controllers/user";
import { checkSessionIdExists } from "../middlewares/checkSessionIdExists";

export async function mealRoutes(app: FastifyInstance) {
  app.post("/meal", MealController.create);
  app.get(
    "/meals",
    { preHandler: [checkSessionIdExists] },
    MealController.getAll,
  );
  app.get(
    "/meal/:id",
    { preHandler: [checkSessionIdExists] },
    MealController.getById,
  );
  app.put(
    "/meal/:id",
    { preHandler: [checkSessionIdExists] },
    MealController.update,
  );
  app.patch(
    "/meal/:id",
    { preHandler: [checkSessionIdExists] },
    MealController.patch,
  );
  app.delete(
    "/meal/:id",
    { preHandler: [checkSessionIdExists] },
    MealController.delete,
  );
  app.get(
    "/metrics",
    { preHandler: [checkSessionIdExists] },
    MealController.getMetrics,
  );

  app.post("/signup", UserController.signUp);
  app.post("/signin", UserController.signIn);
}
