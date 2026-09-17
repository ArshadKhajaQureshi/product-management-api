import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import Product from "../src/models/product.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const makeProduct = (overrides = {}) =>
  Product.create({
    name: "Wireless Mouse",
    sku: "SKU-001",
    category: "electronics",
    price: 19.99,
    stock: 5,
    ...overrides,
  });

beforeEach(() => {
  Product.reset();
});

describe("create()", () => {
  it("returns a product with all required fields including a uuid id", () => {
    const product = makeProduct();

    assert.match(product.id, UUID_RE);
    assert.equal(product.name, "Wireless Mouse");
    assert.equal(product.sku, "SKU-001");
    assert.equal(product.category, "electronics");
    assert.equal(product.price, 19.99);
    assert.equal(product.stock, 5);
    assert.ok(product.createdAt instanceof Date);
  });

  it('sets status to "active" and archivedAt to null by default', () => {
    const product = makeProduct();

    assert.equal(product.status, "active");
    assert.equal(product.archivedAt, null);
  });

  it("throws if name is missing", () => {
    assert.throws(() => makeProduct({ name: undefined }), /name is required/);
  });

  it("throws if sku is missing", () => {
    assert.throws(() => makeProduct({ sku: undefined }), /sku is required/);
  });

  it("throws if price is zero or negative", () => {
    assert.throws(() => makeProduct({ sku: "SKU-ZERO", price: 0 }), /price must be greater than 0/);
    assert.throws(() => makeProduct({ sku: "SKU-NEG", price: -5 }), /price must be greater than 0/);
  });

  it("throws if a product with the same sku already exists", () => {
    makeProduct({ sku: "SKU-DUP" });

    assert.throws(() => makeProduct({ sku: "SKU-DUP" }), /sku already exists/);
  });
});

describe("findAll({})", () => {
  it("returns all non-archived products", () => {
    const a = makeProduct({ sku: "SKU-A" });
    const b = makeProduct({ sku: "SKU-B" });
    const archived = makeProduct({ sku: "SKU-C" });
    Product.delete(archived.id);

    const results = Product.findAll({});

    assert.deepEqual(
      new Set(results.map((p) => p.id)),
      new Set([a.id, b.id])
    );
  });

  it("returns empty array when the store is empty", () => {
    assert.deepEqual(Product.findAll({}), []);
  });
});

describe("findAll({ category })", () => {
  it("returns only products matching the category", () => {
    const electronics = makeProduct({ sku: "SKU-A", category: "electronics" });
    makeProduct({ sku: "SKU-B", category: "books" });

    const results = Product.findAll({ category: "electronics" });

    assert.deepEqual(
      results.map((p) => p.id),
      [electronics.id]
    );
  });
});

describe("findAll({ minPrice, maxPrice })", () => {
  it("returns products with price within the range (inclusive)", () => {
    const low = makeProduct({ sku: "SKU-LOW", price: 10 });
    const mid = makeProduct({ sku: "SKU-MID", price: 15 });
    const high = makeProduct({ sku: "SKU-HIGH", price: 20 });
    makeProduct({ sku: "SKU-OUT", price: 25 });

    const results = Product.findAll({ minPrice: 10, maxPrice: 20 });

    assert.deepEqual(
      new Set(results.map((p) => p.id)),
      new Set([low.id, mid.id, high.id])
    );
  });
});

describe('findAll({ inStock: "true" })', () => {
  it("returns only products with stock > 0", () => {
    const inStock = makeProduct({ sku: "SKU-IN", stock: 3 });
    makeProduct({ sku: "SKU-OUT", stock: 0 });

    const results = Product.findAll({ inStock: true });

    assert.deepEqual(
      results.map((p) => p.id),
      [inStock.id]
    );
  });
});

describe('findAll({ search: "wireless" })', () => {
  it("returns products whose name or description contains the term", () => {
    const byName = makeProduct({ sku: "SKU-NAME", name: "Wireless Mouse" });
    const byDescription = makeProduct({
      sku: "SKU-DESC",
      name: "Mouse Pad",
      description: "Pairs well with any wireless mouse",
    });
    makeProduct({ sku: "SKU-OTHER", name: "USB Cable", description: "A plain cable" });

    const results = Product.findAll({ search: "wireless" });

    assert.deepEqual(
      new Set(results.map((p) => p.id)),
      new Set([byName.id, byDescription.id])
    );
  });
});

describe("findById(id)", () => {
  it("returns the correct product", () => {
    const product = makeProduct();

    assert.deepEqual(Product.findById(product.id), product);
  });

  it("returns null for unknown id", () => {
    assert.equal(Product.findById("00000000-0000-0000-0000-000000000000"), null);
  });

  it("returns null for an archived product id", () => {
    const product = makeProduct();
    Product.delete(product.id);

    assert.equal(Product.findById(product.id), null);
  });
});

describe("findBySku(sku)", () => {
  it("returns the correct product", () => {
    const product = makeProduct({ sku: "SKU-FIND" });

    assert.deepEqual(Product.findBySku("SKU-FIND"), product);
  });

  it("returns null for unknown sku", () => {
    assert.equal(Product.findBySku("SKU-MISSING"), null);
  });
});

describe("update(id, patch)", () => {
  it("updates only the provided fields", () => {
    const product = makeProduct({ stock: 5, price: 10 });

    const updated = Product.update(product.id, { price: 25 });

    assert.equal(updated.price, 25);
    assert.equal(updated.stock, 5);
    assert.equal(updated.name, product.name);
  });

  it("does not allow overwriting id or createdAt", () => {
    const product = makeProduct();
    const fakeId = "11111111-1111-1111-1111-111111111111";
    const fakeCreatedAt = new Date("2000-01-01");

    const updated = Product.update(product.id, { id: fakeId, createdAt: fakeCreatedAt, price: 30 });

    assert.equal(updated.id, product.id);
    assert.deepEqual(updated.createdAt, product.createdAt);
    assert.equal(updated.price, 30);
  });
});

describe("delete(id)", () => {
  it("sets archivedAt (soft archive, record is kept)", () => {
    const product = makeProduct();

    Product.delete(product.id);

    const archived = Product.findBySku(product.sku);
    assert.ok(archived);
    assert.ok(archived.archivedAt instanceof Date);
  });

  it("archived product excluded from findAll()", () => {
    const product = makeProduct();
    Product.delete(product.id);

    assert.deepEqual(Product.findAll({}), []);
  });
});

describe("restore(id)", () => {
  it("clears archivedAt", () => {
    const product = makeProduct();
    Product.delete(product.id);

    const restored = Product.restore(product.id);

    assert.equal(restored.archivedAt, null);
  });

  it("restored product reappears in findAll()", () => {
    const product = makeProduct();
    Product.delete(product.id);
    Product.restore(product.id);

    assert.deepEqual(
      Product.findAll({}).map((p) => p.id),
      [product.id]
    );
  });
});
