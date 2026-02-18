import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import request from "supertest";
import { app } from "../src/app";
import { randomUUID } from "node:crypto";

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

describe("User routes", () => {
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

  it("should not allow user creation without name or password", async () => {
    await request(app.server)
      .post("/signup")
      .send({})
      .expect(400)
      .expect((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            message: "Invalid input",
          }),
        );
      });
  });

  it("should be able to sign in with valid credentials", async () => {
    await request(app.server).post("/signup").send({
      name: "John Doe",
      password: "123456",
    });

    await request(app.server)
      .post("/signin")
      .send({
        name: "John Doe",
        password: "123456",
      })
      .expect(200)
      .expect((res) => {
        const cookies = res.headers["set-cookie"][0];

        expect(cookies).toBeDefined();
        expect(cookies).toContain("sessionId=");
      });
  });

  it("should not allow sign in with invalid credentials", async () => {
    await request(app.server).post("/signup").send({
      name: "John Doe",
      password: "123456",
    });

    await request(app.server)
      .post("/signin")
      .send({
        name: "John Doe",
        password: "wrongpassword",
      })
      .expect(404)
      .expect((res) => {
        expect(res.body).toEqual({
          message: "User not found",
        });
      });
  });

  it("should not allow sign in without name or password", async () => {
    await request(app.server)
      .post("/signin")
      .send({})
      .expect(400)
      .expect((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            message: "Invalid input",
          }),
        );
      });
  });
});

describe("Meal routes", () => {
  it("should create a meal and set cookie when none provided", async () => {
    const response = await request(app.server)
      .post("/meal")
      .send({
        name: "Breakfast",
        description: "Eggs and bacon",
        date: new Date().toISOString(),
        isOnDiet: true,
      })
      .expect(201);

    const cookies = response.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "Meal created successfully",
        results: expect.objectContaining({
          id: expect.any(String),
          name: "Breakfast",
        }),
      }),
    );
  });

  it("should create meals under a given session and list only that session's meals", async () => {
    // create first user/session
    const resA = await request(app.server)
      .post("/signup")
      .send({ name: "A", password: "1" });
    const cookieA = resA.headers["set-cookie"][0];

    // create second user/session
    const resB = await request(app.server)
      .post("/signup")
      .send({ name: "B", password: "1" });
    const cookieB = resB.headers["set-cookie"][0];

    // create meal for A
    await request(app.server)
      .post("/meal")
      .set("Cookie", [cookieA])
      .send({
        name: "A meal",
        description: "desc",
        date: new Date().toISOString(),
        isOnDiet: true,
      })
      .expect(201);

    // create meal for B
    await request(app.server)
      .post("/meal")
      .set("Cookie", [cookieB])
      .send({
        name: "B meal",
        description: "desc",
        date: new Date().toISOString(),
        isOnDiet: false,
      })
      .expect(201);

    // list for A
    const listA = await request(app.server)
      .get("/meals")
      .set("Cookie", [cookieA])
      .expect(200);
    expect(listA.body.result).toHaveLength(1);
    expect(listA.body.result[0]).toEqual(
      expect.objectContaining({ name: "A meal" }),
    );
  });

  it("should get, update (put), patch and delete a meal respecting session ownership", async () => {
    const signup = await request(app.server)
      .post("/signup")
      .send({ name: "UserX", password: "pw" });
    const cookie = signup.headers["set-cookie"][0];

    // create meal
    const create = await request(app.server)
      .post("/meal")
      .set("Cookie", [cookie])
      .send({
        name: "Lunch",
        description: "Rice",
        date: new Date().toISOString(),
        isOnDiet: false,
      })
      .expect(201);

    const meal = create.body.results;

    // get by id
    const get = await request(app.server)
      .get(`/meal/${meal.id}`)
      .set("Cookie", [cookie])
      .expect(200);
    expect(get.body.result).toEqual(
      expect.objectContaining({ id: meal.id, name: "Lunch" }),
    );

    // put
    const newDate = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    const put = await request(app.server)
      .put(`/meal/${meal.id}`)
      .set("Cookie", [cookie])
      .send({
        name: "Lunch Updated",
        description: "Beans",
        date: newDate,
        isOnDiet: true,
      })
      .expect(200);
    expect(put.body.result).toEqual(
      expect.objectContaining({ id: meal.id, name: "Lunch Updated" }),
    );

    // patch
    const patch = await request(app.server)
      .patch(`/meal/${meal.id}`)
      .set("Cookie", [cookie])
      .send({ description: "Beans and salad" })
      .expect(200);
    expect(patch.body.result).toEqual(
      expect.objectContaining({ description: "Beans and salad" }),
    );

    // delete
    await request(app.server)
      .delete(`/meal/${meal.id}`)
      .set("Cookie", [cookie])
      .expect(200);

    // ensure deleted
    await request(app.server)
      .get(`/meal/${meal.id}`)
      .set("Cookie", [cookie])
      .expect(404);
  });

  it("should compute metrics correctly (total, on/off diet, best sequence)", async () => {
    const signup = await request(app.server)
      .post("/signup")
      .send({ name: "MetricsUser", password: "pw" });
    const cookie = signup.headers["set-cookie"][0];

    const base = new Date();
    const meals = [
      {
        name: "m1",
        date: new Date(base.getTime() + 0 * 1000).toISOString(),
        isOnDiet: true,
      },
      {
        name: "m2",
        date: new Date(base.getTime() + 1 * 1000).toISOString(),
        isOnDiet: true,
      },
      {
        name: "m3",
        date: new Date(base.getTime() + 2 * 1000).toISOString(),
        isOnDiet: false,
      },
      {
        name: "m4",
        date: new Date(base.getTime() + 3 * 1000).toISOString(),
        isOnDiet: true,
      },
      {
        name: "m5",
        date: new Date(base.getTime() + 4 * 1000).toISOString(),
        isOnDiet: true,
      },
      {
        name: "m6",
        date: new Date(base.getTime() + 5 * 1000).toISOString(),
        isOnDiet: true,
      },
    ];

    for (const m of meals) {
      await request(app.server)
        .post("/meal")
        .set("Cookie", [cookie])
        .send({
          name: m.name,
          description: "d",
          date: m.date,
          isOnDiet: m.isOnDiet,
        })
        .expect(201);
    }

    const metrics = await request(app.server)
      .get("/metrics")
      .set("Cookie", [cookie])
      .expect(200);
    expect(metrics.body.result).toEqual(
      expect.objectContaining({
        totalMeals: 6,
        mealsOnDiet: 5,
        mealsOffDiet: 1,
        bestSequenceOnDiet: 3,
      }),
    );
  });
});
