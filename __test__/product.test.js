const request = require("supertest");
const app = require("../app");

// All product endpoints have a 2-second simulated delay
jest.setTimeout(5000);

describe("Product API Endpoints", () => {
  beforeAll(async () => {
    // fakeStoreData.js uses async fs.readFile; wait for it to populate before tests run
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  describe("GET /products/categories", () => {
    it("should return an array of all 4 category strings", async () => {
      const res = await request(app).get("/products/categories");
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(4);
      expect(res.body).toEqual(
        expect.arrayContaining([
          "electronics",
          "jewelery",
          "men's clothing",
          "women's clothing",
        ])
      );
    });
  });

  describe("GET /products/:id", () => {
    it("should return a product with all required fields for a valid ID", async () => {
      const res = await request(app).get("/products/1");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("id", 1);
      expect(res.body).toHaveProperty(
        "title",
        "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops"
      );
      expect(res.body).toHaveProperty("price", 109.95);
      expect(res.body).toHaveProperty("category", "men's clothing");
      expect(res.body).toHaveProperty("image");
      expect(res.body).toHaveProperty("description");
      expect(res.body).toHaveProperty("rating");
      expect(res.body.rating).toHaveProperty("rate");
      expect(res.body.rating).toHaveProperty("count");
    });

    it("should return a valid product for the last product ID (20)", async () => {
      const res = await request(app).get("/products/20");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("id", 20);
      expect(res.body).not.toHaveProperty("error");
    });

    it("should return a NotFound error object for an ID that does not exist", async () => {
      const res = await request(app).get("/products/99");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("error", "nodata");
      expect(res.body).toHaveProperty("path", "products/99");
    });

    it("should return a NotFound error object for ID 0", async () => {
      const res = await request(app).get("/products/0");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("error", "nodata");
      expect(res.body).toHaveProperty("path", "products/0");
    });
  });

  describe("GET /products/category/:category", () => {
    it("should return an array of electronics products", async () => {
      const res = await request(app).get("/products/category/electronics");
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      res.body.forEach((product) => {
        expect(product).toHaveProperty("category", "electronics");
      });
    });

    it("should return an array of jewelery products", async () => {
      const res = await request(app).get("/products/category/jewelery");
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      res.body.forEach((product) => {
        expect(product).toHaveProperty("category", "jewelery");
      });
    });

    it("should return men's clothing products using URL-encoded category", async () => {
      const res = await request(app).get(
        "/products/category/men%27s%20clothing"
      );
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      res.body.forEach((product) => {
        expect(product).toHaveProperty("category", "men's clothing");
      });
    });

    it("should return women's clothing products using URL-encoded category", async () => {
      const res = await request(app).get(
        "/products/category/women%27s%20clothing"
      );
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      res.body.forEach((product) => {
        expect(product).toHaveProperty("category", "women's clothing");
      });
    });

    it("should return a NotFound error object for an invalid category", async () => {
      const res = await request(app).get("/products/category/invalid-category");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("error", "nodata");
      expect(res.body).toHaveProperty("path");
    });
  });
});
