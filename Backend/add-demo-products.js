const mongoose = require("mongoose");
const Product = require("./src/models/Product");

const products = [
  { name: "Samsung Galaxy Smartphone", description: "Modern smartphone with a vibrant display and reliable performance.", price: 89999, originalPrice: 99999, stock: 15, image: "iphone.jpg" },
  { name: "Bluetooth Wireless Earbuds", description: "Compact wireless earbuds for music and calls.", price: 3499, originalPrice: 4499, stock: 30, image: "headphones.jpg" },
  { name: "Gaming Laptop", description: "Performance laptop for gaming, study, and work.", price: 189999, originalPrice: 199999, stock: 8, image: "iphone.jpg" },
  { name: "Smart Watch", description: "Smart watch for daily activity and notifications.", price: 7999, originalPrice: 9999, stock: 20, image: "headphones.jpg" },
  { name: "Men's Casual Sneakers", description: "Comfortable casual sneakers for everyday wear.", price: 4499, originalPrice: 5499, stock: 25, image: "headphones.jpg" },
  { name: "Women's Handbag", description: "Stylish everyday handbag with useful storage.", price: 3999, originalPrice: 4999, stock: 18, image: "headphones.jpg" },
  { name: "Cotton T-Shirt", description: "Soft cotton T-shirt for casual outfits.", price: 1299, originalPrice: 1599, stock: 40, image: "headphones.jpg" },
  { name: "Travel Backpack", description: "Everyday backpack for school, work, and travel.", price: 2999, originalPrice: 3699, stock: 22, image: "headphones.jpg" },
  { name: "Portable Bluetooth Speaker", description: "Portable speaker for music at home or outdoors.", price: 4999, originalPrice: 5999, stock: 16, image: "headphones.jpg" },
  { name: "Wireless Computer Mouse", description: "Wireless mouse for office and home computing.", price: 1499, originalPrice: 1999, stock: 35, image: "headphones.jpg" },
  { name: "Mechanical Gaming Keyboard", description: "Gaming keyboard designed for responsive typing.", price: 5499, originalPrice: 6499, stock: 12, image: "headphones.jpg" },
  { name: "HD Webcam", description: "Webcam for video calls, online classes, and meetings.", price: 3999, originalPrice: 4799, stock: 14, image: "headphones.jpg" },
  { name: "Insulated Water Bottle", description: "Reusable bottle for daily hydration.", price: 999, originalPrice: 1299, stock: 45, image: "headphones.jpg" },
  { name: "Ceramic Coffee Mug Set", description: "Coffee mugs for home and office use.", price: 1799, originalPrice: 2299, stock: 20, image: "headphones.jpg" },
  { name: "Desk Lamp", description: "Desk lamp for reading and studying.", price: 2499, originalPrice: 2999, stock: 17, image: "headphones.jpg" },
  { name: "Yoga Mat", description: "Exercise mat for stretching and home workouts.", price: 2199, originalPrice: 2799, stock: 19, image: "headphones.jpg" },
  { name: "Sunglasses", description: "Everyday sunglasses with a modern style.", price: 1999, originalPrice: 2599, stock: 24, image: "headphones.jpg" },
  { name: "Wallet for Men", description: "Compact wallet for cards and cash.", price: 1499, originalPrice: 1899, stock: 28, image: "headphones.jpg" }
];

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI missing. Check Backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  let added = 0;
  let skipped = 0;

  for (const item of products) {
    const exists = await Product.findOne({ name: item.name });
    if (exists) {
      skipped++;
      continue;
    }

    item.discountPercentage = Math.max(
      0,
      Math.round((1 - item.price / item.originalPrice) * 100)
    );

    await Product.create(item);
    added++;
  }

  console.log(`Finished. Added: ${added}, already existed: ${skipped}`);
  console.log(`Total products in database: ${await Product.countDocuments()}`);
}

main()
  .catch((err) => {
    console.error("Product insert failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
