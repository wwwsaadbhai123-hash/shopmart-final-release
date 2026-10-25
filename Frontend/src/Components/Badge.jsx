import React from "react";

function Badge({ children, type = "primary" }) {
  return (
    <span className={`badge badge-${type}`}>
      {children}
    </span>
  );
}

export default Badge;