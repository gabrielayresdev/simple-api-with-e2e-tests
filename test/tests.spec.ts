import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import request from "supertest";
import { app } from "../src/app";
import { randomUUID } from "node:crypto";

describe("User routes", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync("npm run knex migrate:rollback --all");
    execSync("npm run knex migrate:latest");
  });

  it("should be able to create a new user", async () => {
    await request(app.server)
      .post("/signup")
      .send({
        name: "John Doe",
        password: "123456",
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toEqual({
          message: "User created successfully",
          results: {
            id: expect.any(String),
            name: "John Doe",
          },
        });
      });
  });

  it("should not allow duplicate user creation", async () => {
    await request(app.server).post("/signup").send({
      name: "John Doe",
      password: "123456",
    });

    await request(app.server)
      .post("/signup")
      .send({
        name: "John Doe",
        password: "654321",
      })
      .expect(400)
      .expect((res) => {
        expect(res.body).toEqual({
          message: "User already exists",
        });
      });
  });

  it("should not allow session ID duplication", async () => {
    const session_id = randomUUID();

    await request(app.server)
      .post("/signup")
      .set("Cookie", [`sessionId=${session_id}`])
      .send({
        name: "John Doe",
        password: "123456",
      });

    await request(app.server)
      .post("/signup")
      .set("Cookie", [`sessionId=${session_id}`])
      .send({
        name: "John Doe 2",
        password: "123456",
      })
      .expect(400)
      .expect((res) => {
        expect(res.body).toEqual({
          message: "Session ID already exists",
        });
      });
  });
});
