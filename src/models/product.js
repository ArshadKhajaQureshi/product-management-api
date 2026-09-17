import { v4 as uuidv4 } from "uuid";

const byId = new Map();
const bySku = new Map();

const matchesProduct = (product, filters) => {
  const { category, status, minPrice, maxPrice, inStock, search } = filters;

  if (category !== undefined && product.category !== category) return false;
  if (status !== undefined && product.status !== status) return false;
  if (minPrice !== undefined && product.price < minPrice) return false;
  if (maxPrice !== undefined && product.price > maxPrice) return false;
  if (inStock !== undefined && product.stock > 0 !== inStock) return false;

  if (search !== undefined) {
    const term = search.toLowerCase();
    if (!product.name.toLowerCase().includes(term)) {
      const description = product.description ?? "";
      if (!description.toLowerCase().includes(term)) return false;
    }
  }

  return true;
};

const findAll = (filters = {}) => {
  const results = [];
  for (const product of byId.values()) {
    if (product.archivedAt !== null) continue;
    if (!matchesProduct(product, filters)) continue;
    results.push(product);
  }
  return results;
};

const findById = (id) => {
  const product = byId.get(id);
  return product && product.archivedAt === null ? product : null;
};

const findBySku = (sku) => bySku.get(sku) ?? null;

const create = (data) => {
  if (!data.name) throw new Error("name is required");
  if (!data.sku) throw new Error("sku is required");
  if (typeof data.price !== "number" || data.price <= 0) throw new Error("price must be greater than 0");
  if (bySku.has(data.sku)) throw new Error("sku already exists");

  const product = {
    id: uuidv4(),
    name: data.name,
    sku: data.sku,
    description: data.description ?? null,
    category: data.category,
    price: data.price,
    stock: data.stock,
    status: data.status ?? "active",
    createdAt: new Date(),
    archivedAt: null,
  };
  byId.set(product.id, product);
  bySku.set(product.sku, product);
  return product;
};

const update = (id, patch) => {
  const existing = byId.get(id);
  if (!existing) return null;

  const { id: _id, createdAt: _createdAt, ...safePatch } = patch;
  const updated = { ...existing, ...safePatch };
  byId.set(id, updated);

  if (safePatch.sku !== undefined && safePatch.sku !== existing.sku) {
    bySku.delete(existing.sku);
  }
  bySku.set(updated.sku, updated);

  return updated;
};

const deleteById = (id) => {
  const existing = byId.get(id);
  if (!existing || existing.archivedAt !== null) return false;

  const archived = { ...existing, archivedAt: new Date() };
  byId.set(id, archived);
  bySku.set(existing.sku, archived);
  return true;
};

const restore = (id) => {
  const existing = byId.get(id);
  if (!existing || existing.archivedAt === null) return null;

  const restored = { ...existing, archivedAt: null };
  byId.set(id, restored);
  bySku.set(existing.sku, restored);
  return restored;
};

const reset = () => {
  byId.clear();
  bySku.clear();
};

export default { findAll, findById, findBySku, create, update, delete: deleteById, restore, reset };
