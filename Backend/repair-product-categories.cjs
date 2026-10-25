require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Product = require("./src/models/Product");
const Category = require("./src/models/Category");

const DRY_RUN = process.env.CATEGORY_REPAIR_DRY_RUN !== "false";
const backupDir = path.resolve("../ShopMart-Category-Backup");

const groups = {
  "Fashion & Accessories": [
    "Wallet for Men",
    "Sunglasses",
    "Travel Backpack",
    "Cotton T-Shirt",
    "Women's Handbag",
    "Men's Casual Sneakers"
  ],
  "Sports & Fitness": ["Yoga Mat"],
  "Home & Living": [
    "Desk Lamp",
    "Ceramic Coffee Mug Set",
    "Insulated Water Bottle"
  ],
  "Electronics": [
    "HD Webcam",
    "Portable Bluetooth Speaker",
    "Smart Watch",
    "Bluetooth Wireless Earbuds",
    "Samsung Galaxy Smartphone",
    "ShopMart Smartphone",
    "ShopMart Wireless Headphones"
  ],
  "Computers & Accessories": [
    "Mechanical Gaming Keyboard",
    "Wireless Computer Mouse",
    "Gaming Laptop"
  ]
};

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI missing; no changes made.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected.");

  const products = await Product.find({}).lean();
  const categories = await Category.find({}).lean();

  const expectedNames = Object.values(groups).flat();
  const expectedSet = new Set(expectedNames);
  const matches = products.filter(p => expectedSet.has(p.name));

  console.log(`Products in database: ${products.length}`);
  console.log(`Existing categories: ${categories.length}`);
  console.log(`Expected products matched: ${matches.length}/${expectedNames.length}`);

  const missing = expectedNames.filter(
    name => !products.some(p => p.name === name)
  );

  if (missing.length) {
    console.log("Missing expected product names:", missing);
    throw new Error("Product-name verification failed. No database changes made.");
  }

  const duplicateNames = expectedNames.filter(
    name => products.filter(p => p.name === name).length !== 1
  );

  if (duplicateNames.length) {
    console.log("Duplicate product names:", duplicateNames);
    throw new Error("Ambiguous product names. No database changes made.");
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.mkdirSync(backupDir, { recursive: true });

  fs.writeFileSync(
    path.join(backupDir, `products-before-${stamp}.json`),
    JSON.stringify(products, null, 2)
  );

  fs.writeFileSync(
    path.join(backupDir, `categories-before-${stamp}.json`),
    JSON.stringify(categories, null, 2)
  );

  console.log("JSON backup saved:", backupDir);

  const categoryByName = new Map(
    categories.map(c => [c.name.trim().toLowerCase(), c])
  );

  for (const categoryName of Object.keys(groups)) {
    const existing = categoryByName.get(categoryName.toLowerCase());
    if (existing && existing.isActive === false) {
      throw new Error(
        `Category "${categoryName}" exists but is inactive. No changes made.`
      );
    }
  }

  const plan = [];

  for (const [categoryName, names] of Object.entries(groups)) {
    const category = categoryByName.get(categoryName.toLowerCase());

    for (const name of names) {
      const product = products.find(p => p.name === name);
      plan.push({
        productId: String(product._id),
        productName: product.name,
        currentCategory: product.category ? String(product.category) : null,
        targetCategory: category ? String(category._id) : `(create) ${categoryName}`,
        categoryName
      });
    }
  }

  console.log("\nAssignment preview:");
  console.table(plan);

  if (DRY_RUN) {
    console.log("\nDRY RUN ONLY. Database was not modified.");
    console.log("Review the product/category preview and backup files first.");
    return;
  }

  // Do not overwrite existing non-null category assignments.
  const alreadyAssigned = matches.filter(p => p.category != null);
  if (alreadyAssigned.length) {
    console.log(
      "Products already assigned to categories:",
      alreadyAssigned.map(p => p.name)
    );
    throw new Error(
      "Some products already have categories. No updates made; review before proceeding."
    );
  }

  const createdCategoryIds = [];

  try {
    for (const categoryName of Object.keys(groups)) {
      let category = categoryByName.get(categoryName.toLowerCase());

      if (!category) {
        category = await Category.create({
          name: categoryName,
          description: `ShopMart ${categoryName} products`,
          image: "",
          isActive: true
        });
        createdCategoryIds.push(category._id);
        categoryByName.set(categoryName.toLowerCase(), category);
      }
    }

    let updatedCount = 0;

    for (const [categoryName, names] of Object.entries(groups)) {
      const category = categoryByName.get(categoryName.toLowerCase());

      const result = await Product.updateMany(
        {
          name: { $in: names },
          category: null
        },
        { $set: { category: category._id } }
      );

      updatedCount += result.modifiedCount || 0;
    }

    const verified = await Product.find({
      name: { $in: expectedNames }
    }).populate("category", "name").lean();

    const bad = verified.filter(
      p => !p.category ||
        !groups[p.category.name]?.includes(p.name)
    );

    if (bad.length || verified.length !== expectedNames.length) {
      throw new Error(
        `Verification failed. matched=${verified.length}, invalid=${bad.length}`
      );
    }

    console.log(`\nUpdated products: ${updatedCount}`);
    console.log("All expected products now have their intended categories.");
    console.table(
      verified.map(p => ({
        product: p.name,
        category: p.category.name
      }))
    );
  } catch (error) {
    console.error("\nUpdate did not complete successfully:", error.message);
    console.error(
      "Before restoring anything, inspect the JSON backups and current database state."
    );
    throw error;
  }
}

main()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
