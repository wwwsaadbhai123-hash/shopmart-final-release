// =========================================================
// UPLOAD MIDDLEWARE
// Used for seller CNIC document uploads (Phase 15 — Seller Registration)
// =========================================================

const fs = require("fs");
const path = require("path");
const multer = require("multer");

const sellerDocsDir = path.join(
  __dirname,
  "../../uploads/seller-documents"
);

// Ensure the destination folder exists before multer writes to it
if (!fs.existsSync(sellerDocsDir)) {
  fs.mkdirSync(sellerDocsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, sellerDocsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    const ext = path.extname(file.originalname);

    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, PNG, or WEBP images are allowed for CNIC uploads."
      )
    );
  }
};

const uploadSellerDocs = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
});

module.exports = {
  uploadSellerDocs,
};
