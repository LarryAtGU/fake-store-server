// product.js
var express = require("express");
var router = express.Router();
const { getFakeStoreData } = require("../db/fakeStoreData");

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product listing, individual lookup, and category filtering
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Rating:
 *       type: object
 *       required: [rate, count]
 *       properties:
 *         rate:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 5
 *           example: 3.9
 *         count:
 *           type: integer
 *           example: 120
 *     Product:
 *       type: object
 *       required: [id, title, price, description, category, image, rating]
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique product ID (1–20)
 *           example: 1
 *         title:
 *           type: string
 *           example: "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops"
 *         price:
 *           type: number
 *           format: float
 *           example: 109.95
 *         description:
 *           type: string
 *           example: "Your perfect pack for everyday use and walks in the forest."
 *         category:
 *           type: string
 *           enum: [electronics, jewelery, "men's clothing", "women's clothing"]
 *           example: "men's clothing"
 *         image:
 *           type: string
 *           description: >
 *             Relative image path served by this local server.
 *             Construct the full URL in your React Native app using your platform constant:
 *             `${server}:${port}${product.image}`
 *           example: "/img/product-1.png"
 *         rating:
 *           $ref: '#/components/schemas/Rating'
 *     NotFound:
 *       type: object
 *       description: Returned when the path does not match any key in the data store
 *       properties:
 *         error:
 *           type: string
 *           example: "nodata"
 *         path:
 *           type: string
 *           description: The internal path that was looked up
 *           example: "products/99"
 */

/**
 * @swagger
 * /products/categories:
 *   get:
 *     summary: Get all product categories
 *     description: >
 *       Returns an array of all available category name strings.
 *       Note: responses include a 2-second simulated delay.
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: An array of category name strings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *             example:
 *               - "electronics"
 *               - "jewelery"
 *               - "men's clothing"
 *               - "women's clothing"
 */

/**
 * @swagger
 * /products/category/{category}:
 *   get:
 *     summary: Get products by category
 *     description: >
 *       Returns all products belonging to the specified category.
 *       Available categories: electronics, jewelery, men's clothing, women's clothing.
 *       Important: URL-encode category names that contain spaces or apostrophes.
 *       In React Native always use encodeURIComponent(category) in your fetch call.
 *       Note: responses include a 2-second simulated delay.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         description: >
 *           The category name. Must be URL-encoded when it contains special characters.
 *           men's clothing → men%27s%20clothing,
 *           women's clothing → women%27s%20clothing
 *         schema:
 *           type: string
 *           enum:
 *             - electronics
 *             - jewelery
 *             - men's clothing
 *             - women's clothing
 *         example: electronics
 *     responses:
 *       200:
 *         description: >
 *           An array of products in the specified category.
 *           Returns a NotFound error object if the category does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 - $ref: '#/components/schemas/NotFound'
 */

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a single product by ID
 *     description: >
 *       Returns one product matching the given numeric ID.
 *       Valid product IDs are 1 through 20.
 *       Returns a NotFound error object if the ID does not exist.
 *       Note: responses include a 2-second simulated delay.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The numeric product ID (1–20)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *         example: 1
 *     responses:
 *       200:
 *         description: >
 *           A single product object if found, or a NotFound error object if the ID does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Product'
 *                 - $ref: '#/components/schemas/NotFound'
 */

router.get("/*", (req, res, next) => {
  const path = req.params[0] ? "products/" + req.params[0] : "products";
  const data = getFakeStoreData(path) || { error: "nodata", path };

  setTimeout(() => {
    res.json(data);
  }, 2000);
});

module.exports = router;
