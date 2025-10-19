const supertest = require("supertest");
const app =require("../src/app");
const { db, close } = require("../src/config/db");

describe("User Controller", () => {
  let server;
  let testUser;

  beforeAll(async () => {
    server = app.listen(4001);

    testUser = await db.one(
      "INSERT INTO users (id, email, name, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      ["test-user-id", "test@example.com", "Test User", "SELLER", "approved"]
    );
  });

  afterAll(async () => {
    await db.none("DELETE FROM users WHERE id = $1", ["test-user-id"]);
    server.close();
  });

  it("should update user role to BUYER and set status to null", async () => {
    const response = await supertest(server)
      .put(`/api/users/${testUser.id}`)
      .send({ role: "BUYER" });

    expect(response.status).toBe(200);
    expect(response.body.role).toBe("BUYER");
    expect(response.body.status).toBeNull();
  });
});
