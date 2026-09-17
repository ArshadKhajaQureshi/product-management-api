import { v4 as uuidv4 } from "uuid";

let products = [];

const matchesProduct = (product, filters) => {
  const { category, status, minPrice, maxPrice, inStock, search } = filters;

  if (category !== undefined && product.category !== category) return false;
  if (status !== undefined && product.status !== status) return false;
  if (minPrice !== undefined && product.price < minPrice) return false;
  if (maxPrice !== undefined && product.price > maxPrice) return false;
  if (inStock !== undefined && product.stock > 0 !== inStock) return false;
  if (search !== undefined) {
    const term = search.toLowerCase();
    const inName = product.name.toLowerCase().includes(term);
    const inDescription = (product.description ?? "").toLowerCase().includes(term);
    if (!inName && !inDescription) return false;
  }

  return true;
};

const findAll = (filters = {}) =>
  products.filter((product) => product.archivedAt === null && matchesProduct(product, filters));

const findById = (id) => products.find((product) => product.id === id && product.archivedAt === null);

const findBySku = (sku) => products.find((product) => product.sku === sku);

const create = (data) => {
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
  products.push(product);
  return product;
};

const update = (id, patch) => {
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) return null;

  products[index] = { ...products[index], ...patch };
  return products[index];
};

const deleteById = (id) => {
  const index = products.findIndex((product) => product.id === id && product.archivedAt === null);
  if (index === -1) return false;

  products[index] = { ...products[index], archivedAt: new Date() };
  return true;
};

const restore = (id) => {
  const index = products.findIndex((product) => product.id === id && product.archivedAt !== null);
  if (index === -1) return null;

  products[index] = { ...products[index], archivedAt: null };
  return products[index];
};

export default { findAll, findById, findBySku, create, update, delete: deleteById, restore };
