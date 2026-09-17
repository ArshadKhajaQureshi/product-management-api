import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import createApp from "../src/app.js";
import Product from "../src/models/product.js";

let app;
let productA;
let productB;

beforeEach(() => {
  Product.reset();
  app = createApp();

  productA = Product.create({
    name: "Wireless Mouse",
    sku: "SKU-A",
    category: "electronics",
    price: 19.99,
    stock: 5,
    description: "A comfortable wireless mouse",
  });

  productB = Product.create({
    name: "Cotton T-Shirt",
    sku: "SKU-B",
    category: "clothing",
    price: 9.99,
    stock: 0,
    description: "Plain cotton t-shirt",
  });
});

describe("GET /products", () => {
  it("returns 200 and an array", async () => {
    const res = await request(app).get("/products");

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  it("returns only non-archived products", async () => {
    await request(app).delete(`/products/${productB.id}`);

    const res = await request(app).get("/products");

    assert.deepEqual(
      res.body.data.map((p) => p.id),
      [productA.id]
    );
  });

  it("?category=electronics returns only matching products", async () => {
    const res = await request(app).get("/products").query({ category: "electronics" });

    assert.deepEqual(
      res.body.data.map((p) => p.id),
      [productA.id]
    );
  });

  it("?minPrice and ?maxPrice filter correctly", async () => {
    const res = await request(app).get("/products").query({ minPrice: 15, maxPrice: 25 });

    assert.deepEqual(
      res.body.data.map((p) => p.id),
      [productA.id]
    );
  });

  it("?inStock=true returns products with stock > 0", async () => {
    const res = await request(app).get("/products").query({ inStock: "true" });

    assert.deepEqual(
      res.body.data.map((p) => p.id),
      [productA.id]
    );
  });

  it("?minPrice=abc (non-numeric) returns 422", async () => {
    const res = await request(app).get("/products").query({ minPrice: "abc" });

    assert.equal(res.status, 422);
  });

  it("?category=unknown returns 422", async () => {
    const res = await request(app).get("/products").query({ category: "unknown" });

    assert.equal(res.status, 422);
  });

  it("?search=<term> matches on name and description", async () => {
    const byDescription = await request(app).post("/products").send({
      name: "Ergonomic Keyboard",
      sku: "SKU-C",
      category: "electronics",
      price: 49.99,
      stock: 2,
      description: "Bundle bonus: wireless charging pad included",
    });

    const res = await request(app).get("/products").query({ search: "wireless" });

    assert.deepEqual(
      new Set(res.body.data.map((p) => p.id)),
      new Set([productA.id, byDescription.body.data.id])
    );
  });
});

describe("GET /products/:id", () => {
  it("returns 200 with the correct product", async () => {
    const res = await request(app).get(`/products/${productA.id}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, productA.id);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).get("/products/00000000-0000-0000-0000-000000000000");

    assert.equal(res.status, 404);
  });

  it("returns 404 for an archived product id", async () => {
    await request(app).delete(`/products/${productA.id}`);

    const res = await request(app).get(`/products/${productA.id}`);

    assert.equal(res.status, 404);
  });
});

describe("POST /products", () => {
  const validPayload = {
    name: "Desk Lamp",
    sku: "SKU-NEW",
    category: "other",
    price: 24.5,
    stock: 3,
  };

  it("returns 201 with the created product including id and createdAt", async () => {
    const res = await request(app).post("/products").send(validPayload);

    assert.equal(res.status, 201);
    assert.ok(res.body.data.id);
    assert.ok(res.body.data.createdAt);
  });

  it("returns 422 when name is missing", async () => {
    const { name, ...payload } = validPayload;
    const res = await request(app).post("/products").send(payload);

    assert.equal(res.status, 422);
  });

  it("returns 422 when sku format is invalid", async () => {
    const res = await request(app).post("/products").send({ ...validPayload, sku: "invalid sku!" });

    assert.equal(res.status, 422);
  });

  it("returns 422 when price is negative", async () => {
    const res = await request(app).post("/products").send({ ...validPayload, price: -5 });

    assert.equal(res.status, 422);
  });

  it("returns 422 when price is zero", async () => {
    const res = await request(app).post("/products").send({ ...validPayload, price: 0 });

    assert.equal(res.status, 422);
  });

  it("returns 201 when stock is zero (out of stock is valid)", async () => {
    const res = await request(app).post("/products").send({ ...validPayload, stock: 0 });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.stock, 0);
  });

  it("returns 409 when sku already exists", async () => {
    const res = await request(app).post("/products").send({ ...validPayload, sku: productA.sku });

    assert.equal(res.status, 409);
  });

  it("only one of two concurrent POSTs with the same sku succeeds", async () => {
    const payload = { ...validPayload, sku: "SKU-RACE" };

    const [first, second] = await Promise.all([
      request(app).post("/products").send(payload),
      request(app).post("/products").send(payload),
    ]);

    const statuses = [first.status, second.status].sort();
    assert.deepEqual(statuses, [201, 409]);

    const listRes = await request(app).get("/products");
    assert.equal(listRes.body.data.filter((p) => p.sku === "SKU-RACE").length, 1);
  });
});

describe("PATCH /products/:id", () => {
  it("returns 200 with only the patched fields changed", async () => {
    const res = await request(app).patch(`/products/${productA.id}`).send({ price: 29.99 });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.price, 29.99);
    assert.equal(res.body.data.name, productA.name);
    assert.equal(res.body.data.stock, productA.stock);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app)
      .patch("/products/00000000-0000-0000-0000-000000000000")
      .send({ price: 10 });

    assert.equal(res.status, 404);
  });

  it("returns 400 when the body is empty", async () => {
    const res = await request(app).patch(`/products/${productA.id}`).send({});

    assert.equal(res.status, 400);
  });

  it("does not allow updating sku or id", async () => {
    const res = await request(app)
      .patch(`/products/${productA.id}`)
      .send({ id: "11111111-1111-1111-1111-111111111111", sku: "SKU-HIJACKED", price: 33 });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, productA.id);
    assert.equal(res.body.data.sku, productA.sku);
    assert.equal(res.body.data.price, 33);
  });

  it("strips unknown fields from the patch", async () => {
    const res = await request(app)
      .patch(`/products/${productA.id}`)
      .send({ price: 15, madeUpField: "should not exist", archivedAt: "2020-01-01" });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.price, 15);
    assert.equal(res.body.data.madeUpField, undefined);
    assert.equal(res.body.data.archivedAt, null);
  });

  it("returns 404 when patching an archived product", async () => {
    await request(app).delete(`/products/${productA.id}`);

    const res = await request(app).patch(`/products/${productA.id}`).send({ price: 15 });

    assert.equal(res.status, 404);
  });
});

describe("DELETE /products/:id", () => {
  it("returns 204", async () => {
    const res = await request(app).delete(`/products/${productA.id}`);

    assert.equal(res.status, 204);
  });

  it("subsequent GET /products/:id returns 404", async () => {
    await request(app).delete(`/products/${productA.id}`);

    const res = await request(app).get(`/products/${productA.id}`);

    assert.equal(res.status, 404);
  });
});

describe("DELETE /products/:id/restore", () => {
  it("returns 200 and product reappears in GET /products", async () => {
    await request(app).delete(`/products/${productA.id}`);

    const restoreRes = await request(app).delete(`/products/${productA.id}/restore`);
    assert.equal(restoreRes.status, 200);

    const listRes = await request(app).get("/products");
    assert.ok(listRes.body.data.some((p) => p.id === productA.id));
  });

  it("returns 404 when restoring a product that was never archived", async () => {
    const res = await request(app).delete(`/products/${productA.id}/restore`);

    assert.equal(res.status, 404);
  });
});
