const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("./src/models/Product");

const imageMap = {
  "ShopMart Smartphone": "iphone.jpg",
  "ShopMart Wireless Headphones": "headphones.jpg",
  "Samsung Galaxy Smartphone": "smartphone.jpg",
  "Bluetooth Wireless Earbuds": "earbuds.jpg",
  "Gaming Laptop": "laptop.jpg",
  "Smart Watch": "watch.jpg",
  "Men's Casual Sneakers": "sneakers.jpg",
  "Women's Handbag": "handbag.jpg",
  "Cotton T-Shirt": "tshirt.jpg",
  "Travel Backpack": "backpack.jpg",
  "Portable Bluetooth Speaker": "speaker.jpg",
  "Wireless Computer Mouse": "mouse.jpg",
  "Mechanical Gaming Keyboard": "keyboard.jpg",
  "HD Webcam": "webcam.jpg",
  "Insulated Water Bottle": "bottle.jpg",
  "Ceramic Coffee Mug Set": "mug.jpg",
  "Desk Lamp": "lamp.jpg",
  "Yoga Mat": "yogamat.jpg",
  "Sunglasses": "sunglasses.jpg",
  "Wallet for Men": "wallet.jpg"
};

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

    let updated = 0;
    const missing = [];

    for (const [name, image] of Object.entries(imageMap)) {
      const result = await Product.updateOne(
        { name },
        { $set: { image } }
      );

      if (result.matchedCount > 0) {
        updated++;
        console.log("UPDATED:", name, "->", image);
      } else {
        missing.push(name);
        console.log("NOT FOUND:", name);
      }
    }

    console.log("\nProducts updated:", updated, "of", Object.keys(imageMap).length);
    if (missing.length) console.log("Names not found:", missing.join(", "));
  } catch (error) {
    console.error("ERROR:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
