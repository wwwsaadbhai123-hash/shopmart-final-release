import React from "react";

function Rating({ value = 5, reviews = 0 }) {
  const rating = Math.max(0, Math.min(5, value));

  return (
    <div
      className="rating"
      aria-label={`Rating ${rating} out of 5`}
    >
      <span>
        {"★".repeat(Math.floor(rating))}
        {"☆".repeat(5 - Math.floor(rating))}
      </span>

      {reviews > 0 && (
        <span
          style={{
            color: "var(--text-muted)",
            fontSize: "13px",
          }}
        >
          ({reviews})
        </span>
      )}
    </div>
  );
}

export default Rating;