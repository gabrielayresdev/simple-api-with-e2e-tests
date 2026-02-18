import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { handleError } from "../utils/handleError";

import { randomUUID } from "node:crypto";
import { knex } from "../../db/database";

const upsertMealSchema = z.object({
  name: z.string(),
  description: z.string(),
  date: z.string(),
  isOnDiet: z.boolean(),
});

const patchMealSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  isOnDiet: z.boolean().optional(),
});

class MealController {
  async create(request: FastifyRequest, response: FastifyReply) {
    try {
      const { name, description, date, isOnDiet } = upsertMealSchema.parse(
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

  async update(request: FastifyRequest, response: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { name, description, date, isOnDiet } = upsertMealSchema.parse(
        request.body,
      );

      const meal = await knex("meals")
        .where({ id })
        .update(
          {
            name,
            description,
            date_time: new Date(date),
            is_on_diet: isOnDiet,
          },
          [],
        )
        .returning("*");

      return response
        .status(200)
        .send({ message: "Meal updated successfully", meal });
    } catch (error) {
      return handleError(response, error);
    }
  }

  async patch(request: FastifyRequest, response: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { name, description, date, isOnDiet } = patchMealSchema.parse(
        request.body,
      );
      const dataToUpdate = {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date_time: new Date(date) }),
        ...(isOnDiet !== undefined && { is_on_diet: isOnDiet }),
      };

      const meal = await knex("meals")
        .where({ id })
        .update(dataToUpdate)
        .returning("*");

      return response
        .status(200)
        .send({ message: "Meal updated successfully", meal });
    } catch (error) {
      return handleError(response, error);
    }
  }
}

export default new MealController();
