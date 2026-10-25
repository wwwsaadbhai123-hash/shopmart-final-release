// ============================================================
// SHOPMART FRONTEND
// PHASE 26 — PERFORMANCE OPTIMIZATION
// FILE: OptimizedImage.jsx
// ============================================================

import { useState } from "react";

const OptimizedImage = ({
  src,
  alt = "",
  className = "",
  width,
  height,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
  };

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      className={`${className} ${
        loaded ? "image-loaded" : "image-loading"
      }`}
      onLoad={handleLoad}
      {...props}
    />
  );
};

export default OptimizedImage;