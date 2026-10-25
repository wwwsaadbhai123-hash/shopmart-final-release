// =========================================================
// PHASE 17 - SELLER PRODUCTS + INVENTORY
// =========================================================

import {
  useEffect,
  useState,
} from "react";
import { API_BASE_URL } from "../config";
import { getImageUrl } from "../utils/imageUrl";


const getAuthToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
};

const emptyForm = {
  title: "",
  description: "",
  price: "",
  stock: "",
  category: "",
  image: "",
};

const formatPrice = (value) => {
  return `Rs. ${Number(
    value || 0
  ).toLocaleString("en-PK")}`;
};

const SellerProducts = ({
  refreshKey = 0,
}) => {
  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [form, setForm] =
    useState(emptyForm);

  // =======================================================
  // LOAD PRODUCTS
  // =======================================================

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        getAuthToken();

      if (!token) {
        throw new Error(
          "Please login first."
        );
      }

      const response =
        await fetch(
          `${API_BASE_URL}/api/sellers/products`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load products."
        );
      }

      setProducts(
        Array.isArray(data.products)
          ? data.products
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [refreshKey]);

  // =======================================================
  // FORM CHANGE
  // =======================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =======================================================
  // OPEN ADD FORM
  // =======================================================

  const openAddForm = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
    setShowForm(true);
  };

  // =======================================================
  // OPEN EDIT FORM
  // =======================================================

  const openEditForm = (product) => {
    setEditingProduct(product);

    setForm({
      title:
        product.title ||
        product.name ||
        "",
      description:
        product.description || "",
      price:
        product.price ?? "",
      stock:
        product.stock ?? "",
      category:
        typeof product.category ===
        "object"
          ? product.category?._id || ""
          : product.category || "",
      image:
        product.image ||
        product.images?.[0] ||
        "",
    });

    setMessage("");
    setError("");
    setShowForm(true);
  };

  // =======================================================
  // SUBMIT PRODUCT
  // =======================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const token =
        getAuthToken();

      if (!token) {
        throw new Error(
          "Please login first."
        );
      }

      const payload = {
        title:
          form.title.trim(),
        description:
          form.description.trim(),
        price:
          Number(form.price),
        stock:
          Number(form.stock),
        category:
          form.category || null,
        image:
          form.image.trim(),
      };

      const url = editingProduct
        ? `${API_BASE_URL}/api/sellers/products/${editingProduct._id}`
        : `${API_BASE_URL}/api/sellers/products`;

      const method =
        editingProduct
          ? "PUT"
          : "POST";

      const response =
        await fetch(url, {
          method,
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            payload
          ),
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save product."
        );
      }

      setMessage(
        editingProduct
          ? "Product updated successfully."
          : "Product added successfully."
      );

      setForm(emptyForm);
      setEditingProduct(null);
      setShowForm(false);

      await loadProducts();
    } catch (err) {
      setError(
        err.message ||
          "Failed to save product."
      );
    } finally {
      setSaving(false);
    }
  };

  // =======================================================
  // DELETE PRODUCT
  // =======================================================

  const handleDelete = async (
    productId
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this product?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const token =
        getAuthToken();

      const response =
        await fetch(
          `${API_BASE_URL}/api/sellers/products/${productId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete product."
        );
      }

      setMessage(
        "Product deleted successfully."
      );

      await loadProducts();
    } catch (err) {
      setError(
        err.message ||
          "Failed to delete product."
      );
    }
  };

  // =======================================================
  // UPDATE STOCK
  // =======================================================

  const handleStockUpdate = async (
    productId,
    currentStock
  ) => {
    const value =
      window.prompt(
        "Enter new stock quantity:",
        String(
          currentStock ?? 0
        )
      );

    if (value === null) {
      return;
    }

    const stock =
      Number(value);

    if (
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      setError(
        "Please enter a valid stock quantity."
      );
      return;
    }

    try {
      setError("");
      setMessage("");

      const token =
        getAuthToken();

      const response =
        await fetch(
          `${API_BASE_URL}/api/sellers/products/${productId}/stock`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              stock: Math.floor(
                stock
              ),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update stock."
        );
      }

      setMessage(
        "Stock updated successfully."
      );

      await loadProducts();
    } catch (err) {
      setError(
        err.message ||
          "Failed to update stock."
      );
    }
  };

  // =======================================================
  // STOCK STATUS
  // =======================================================

  const getStockStatus = (
    stock
  ) => {
    const value =
      Number(stock || 0);

    if (value <= 0) {
      return "Out of Stock";
    }

    if (value <= 5) {
      return "Low Stock";
    }

    return "In Stock";
  };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <section className="seller-products-section">
      <div className="seller-products-header">
        <div>
          <span className="section-label">
            Inventory
          </span>

          <h2>
            Seller Products
          </h2>

          <p>
            Manage your products,
            prices and inventory.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
        >
          + Add Product
        </button>
      </div>

      {message && (
        <div className="seller-success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="seller-error-message">
          {error}
        </div>
      )}

      {showForm && (
        <div className="seller-product-form-card">
          <div className="seller-form-header">
            <h3>
              {editingProduct
                ? "Edit Product"
                : "Add New Product"}
            </h3>

            <button
              type="button"
              onClick={() =>
                setShowForm(false)
              }
            >
              Close
            </button>
          </div>

          <form
            onSubmit={
              handleSubmit
            }
          >
            <div className="seller-form-grid">
              <label>
                Product Title
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={
                    handleChange
                  }
                  placeholder="Enter product title"
                  required
                />
              </label>

              <label>
                Price
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={
                    handleChange
                  }
                  min="0"
                  step="0.01"
                  placeholder="Enter price"
                  required
                />
              </label>

              <label>
                Stock
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={
                    handleChange
                  }
                  min="0"
                  step="1"
                  placeholder="Enter stock"
                  required
                />
              </label>

              <label>
                Category ID
                <input
                  type="text"
                  name="category"
                  value={
                    form.category
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Category ID"
                />
              </label>

              <label className="seller-form-full">
                Image URL
                <input
                  type="text"
                  name="image"
                  value={form.image}
                  onChange={
                    handleChange
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </label>

              <label className="seller-form-full">
                Description
                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  rows="5"
                  placeholder="Enter product description"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingProduct
                ? "Update Product"
                : "Create Product"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="seller-products-loading">
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="seller-products-empty">
          <h3>
            No Products Yet
          </h3>

          <p>
            Add your first product
            to start selling.
          </p>
        </div>
      ) : (
        <div className="seller-products-table-wrapper">
          <table className="seller-products-table">
            <thead>
              <tr>
                <th>
                  Product
                </th>

                <th>
                  Price
                </th>

                <th>
                  Stock
                </th>

                <th>
                  Status
                </th>

                <th>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {products.map(
                (product) => {
                  const stock =
                    Number(
                      product.stock || 0
                    );

                  return (
                    <tr
                      key={
                        product._id
                      }
                    >
                      <td>
                        <div className="seller-product-info">
                          {(product.image ||
                            product.images?.[0]) && (
                            <img
                              src={getImageUrl(
                                product.image ||
                                  product.images?.[0]
                              )}
                              alt={
                                product.title ||
                                product.name ||
                                "Product"
                              }
                            />
                          )}

                          <div>
                            <strong>
                              {product.title ||
                                product.name ||
                                "Product"}
                            </strong>

                            <small>
                              {product.description
                                ? product.description.slice(
                                    0,
                                    70
                                  )
                                : "No description"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {formatPrice(
                          product.price
                        )}
                      </td>

                      <td>
                        <strong>
                          {stock}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`stock-status stock-${getStockStatus(
                            stock
                          )
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              "-"
                            )}`}
                        >
                          {getStockStatus(
                            stock
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="seller-product-actions">
                          <button
                            type="button"
                            onClick={() =>
                              handleStockUpdate(
                                product._id,
                                stock
                              )
                            }
                          >
                            Stock
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                product
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                product._id
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default SellerProducts;