import React from "react";

function CategoryCard({ image, name, productCount, onClick }) {
  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        cursor: "pointer",
        textAlign: "center",
        padding: "0",
        overflow: "hidden",
      }}
    >
      <img
        src={image}
        alt={name}
        style={{
          width: "100%",
          height: "180px",
          objectFit: "cover",
        }}
      />

      <div style={{ padding: "20px" }}>
        <h3
          style={{
            marginBottom: "5px",
            fontSize: "18px",
          }}
        >
          {name}
        </h3>

        {productCount !== undefined && (
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "14px",
            }}
          >
            {productCount} Products
          </p>
        )}
      </div>
    </div>
  );
}

export default CategoryCard;