import test from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { registerDeenRoutes } from "./routes.js";
import { fetchWooProductComments, submitWooProductComment } from "./woo.js";

test("Comments: fetchWooProductComments handles product comments query", async () => {
  const comments = await fetchWooProductComments(14987);
  assert.ok(Array.isArray(comments), "Comments should be an array");
  for (const c of comments) {
    assert.ok(typeof c.id === "number", "Comment must have numeric id");
    assert.ok(typeof c.authorName === "string", "Comment must have authorName");
    assert.ok(typeof c.content === "string", "Comment must have content string");
    assert.ok(c.rating >= 1 && c.rating <= 5, "Rating must be between 1 and 5");
  }
});

test("Comments: submitWooProductComment validates required fields", async () => {
  await assert.rejects(
    async () => {
      await submitWooProductComment({
        productId: 14987,
        authorName: "",
        content: "Great product!",
      });
    },
    { message: /Author name is required/ }
  );

  await assert.rejects(
    async () => {
      await submitWooProductComment({
        productId: 14987,
        authorName: "Test User",
        content: "",
      });
    },
    { message: /Comment text is required/ }
  );
});

test("Comments Routes: GET and POST /v1/deen/products/:id/comments Fastify endpoints", async () => {
  const app = Fastify();
  await registerDeenRoutes(app);
  await app.ready();

  // Test GET endpoint
  const getRes = await app.inject({
    method: "GET",
    url: "/v1/deen/products/14987/comments",
  });
  assert.equal(getRes.statusCode, 200);
  const getBody = getRes.json();
  assert.equal(getBody.productId, "14987");
  assert.ok(Array.isArray(getBody.comments));
  assert.ok(typeof getBody.count === "number");
  assert.ok(typeof getBody.averageRating === "number");

  // Test POST validation
  const postFail = await app.inject({
    method: "POST",
    url: "/v1/deen/products/14987/comments",
    payload: { authorName: "", content: "" },
  });
  assert.equal(postFail.statusCode, 400);

  await app.close();
});
