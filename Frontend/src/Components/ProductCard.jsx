import React from "react";

function ProductCard({
  image,
  title,
  price,
  oldPrice,
  rating = 5,
  category,
  onAddToCart,
  onWishlist,
}) {
  return (
    <div className="product-card">

      {/* Product Image */}
      <div style={{ position: "relative" }}>

        {oldPrice && (
          <span
            className="badge badge-danger"
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              zIndex: 2,
            }}
          >
            Sale
          </span>
        )}

        <button
          type="button"
          onClick={onWishlist}
          aria-label="Add to wishlist"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 2,
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            border: "none",
            background: "#ffffff",
            boxShadow: "var(--shadow-sm)",
            fontSize: "18px",
          }}
        >
          ♡
        </button>

        <img
          src={image}
          alt={title}
          className="product-image"
        />
      </div>

      {/* Product Content */}
      <div className="product-content">

        {category && (
          <span className="badge badge-primary">
            {category}
          </span>
        )}

        <h3 className="product-title">
          {title}
        </h3>

        {/* Rating */}
        <div className="rating">
          {"★".repeat(Math.min(rating, 5))}
          {"☆".repeat(Math.max(5 - rating, 0))}
        </div>

        {/* Price */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: "10px",
            marginBottom: "16px",
          }}
        >
          <span className="product-price">
            Rs. {price.toLocaleString()}
          </span>

          {oldPrice && (
            <span
              style={{
                color: "var(--text-muted)",
                textDecoration: "line-through",
                fontSize: "14px",
              }}
            >
              Rs. {oldPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Cart Button */}
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: "100%" }}
          onClick={onAddToCart}
        >
          🛒 Add to Cart
        </button>

      </div>
    </div>
  );
}

export default ProductCard;