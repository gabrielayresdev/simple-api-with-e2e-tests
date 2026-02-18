import { FastifyReply } from "fastify";
import { z } from "zod";

const handleError = (res: FastifyReply, error: unknown): FastifyReply => {
  console.log("=====================");
  console.log(error);
  console.log("=====================");

  if (error instanceof z.ZodError) {
    return res.status(400).send({
      message: "Invalid input",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (error instanceof Error) {
    return res.status(500).send({ error: "Internal server error" });
  }

  return res
    .status(500)
    .send({ error: "Something went wrong! Try again later." });
};

export { handleError };
