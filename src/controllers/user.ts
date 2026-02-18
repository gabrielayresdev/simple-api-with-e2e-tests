import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { handleError } from "../utils/handleError";

import { randomUUID } from "node:crypto";
import { knex } from "../../db/database";

const userSchema = z.object({
  name: z.string(),
  password: z.string(),
});

class UserController {
  async signIn(request: FastifyRequest, response: FastifyReply) {
    try {
      const { name, password } = userSchema.parse(request.body);

      const user = await knex("users").where({ name, password }).first();

      if (!user) {
        return response.status(404).send({ message: "User not found" });
      }

      response.setCookie("sessionId", user.id, {
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });

      return response.status(200).send({ message: "Login successful" });
    } catch (error) {
      return handleError(response, error);
    }
  }

  async signUp(request: FastifyRequest, response: FastifyReply) {
    try {
      const { name, password } = userSchema.parse(request.body);

      let sessionId = request.cookies.sessionId;

      const existingUser = await knex("users").where({ name }).first();

      if (existingUser) {
        return response.status(400).send({ message: "User already exists" });
      }

      const existingId = await knex("users").where({ id: sessionId }).first();

      if (existingId) {
        return response
          .status(400)
          .send({ message: "Session ID already exists" });
      }

      if (!sessionId) {
        sessionId = randomUUID();

        response.setCookie("sessionId", sessionId, {
          path: "/",
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        });
      }

      const user = await knex("users")
        .insert({
          id: sessionId,
          name,
          password,
        })
        .returning("*");

      return response
        .status(201)
        .send({ message: "User created successfully", results: user[0] });
    } catch (error) {
      return handleError(response, error);
    }
  }
}

export default new UserController();
