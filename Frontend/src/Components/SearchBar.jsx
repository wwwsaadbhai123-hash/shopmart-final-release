import React, { useState } from "react";

function SearchBar({ onSearch, placeholder = "Search products..." }) {
  const [search, setSearch] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (onSearch) {
      onSearch(search);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        width: "100%",
        maxWidth: "600px",
      }}
    >
      <input
        type="search"
        className="form-input"
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
        }}
      />

      <button
        type="submit"
        className="btn btn-primary"
        style={{
          borderRadius: "0 var(--radius-md) var(--radius-md) 0",
        }}
      >
        🔎 Search
      </button>
    </form>
  );
}

export default SearchBar;