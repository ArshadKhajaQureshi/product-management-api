import { randomUUID } from "node:crypto";

let products = [];

export const getAllProducts = () => products;

export const getProductById = (id) => products.find((product) => product.id === id);

export const createProduct = (data) => {
  const product = {
    id: randomUUID(),
    name: data.name,
    sku: data.sku,
    description: data.description ?? null,
    category: data.category,
    price: data.price,
    stock: data.stock,
    status: data.status ?? "active",
    createdAt: new Date().toISOString(),
  };
  products.push(product);
  return product;
};

export const updateProduct = (id, data) => {
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) return null;

  products[index] = { ...products[index], ...data };
  return products[index];
};

export const deleteProduct = (id) => {
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) return false;

  products.splice(index, 1);
  return true;
};
