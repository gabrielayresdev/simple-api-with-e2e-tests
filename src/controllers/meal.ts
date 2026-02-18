import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { handleError } from "../utils/handleError";
import knex from "knex";
import { randomUUID } from "node:crypto";

const createMealSchema = z.object({
  name: z.string(),
  description: z.string(),
  date: z.string(),
  isOnDiet: z.boolean(),
});

class MealController {
  async create(request: FastifyRequest, response: FastifyReply) {
    try {
      const { name, description, date, isOnDiet } = createMealSchema.parse(
        request.body,
      );

      const meal = await knex("meals")
        .insert({
          id: randomUUID(),
          name,
          description,
          date_time: new Date(date),
          is_on_diet: isOnDiet,
        })
        .returning("*");

      return response.status(201).send(meal[0]);
    } catch (error) {
      return handleError(response, error);
    }
  }
}
