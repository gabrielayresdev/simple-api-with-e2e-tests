import { FastifyReply } from "fastify";
import { z } from "zod";

const handleError = (res: FastifyReply, error: unknown): FastifyReply => {
  console.log(error);

  if (error instanceof z.ZodError) {
    return res.status(400).send({ error: error.message });
  }

  if (error instanceof Error) {
    return res.status(500).send({ error: "Internal server error" });
  }

  return res
    .status(500)
    .send({ error: "Something went wrong! Try again later." });
};

export { handleError };
