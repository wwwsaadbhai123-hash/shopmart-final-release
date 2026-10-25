import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { API_BASE_URL } from "./config";
import { handleAuthResponse } from "./utils/authSession";
import { getImageUrl } from "./utils/imageUrl";

// ============================================================
// PHASE 12 / 13 / 14 / 15 COMPONENTS
// ============================================================

import NotificationPanel from "./Components/Notifications";
import ReviewSection from "./Components/ReviewSection";
import ReturnRequest from "./Components/ReturnRequest";
import SellerRegistration from "./Components/SellerRegistration";
import SellerStatus from "./Components/SellerStatus";
import SellerDashboard from "./Components/SellerDashboard";
import SellerSupport from "./Components/SellerSupport";
// ============================================================
// PHASE 17 - SELLER PRODUCTS
// ============================================================

import SellerProducts from "./Components/SellerProducts";

// ============================================================
// PHASE 18 - SELLER ORDERS + RETURNS
// ============================================================

import SellerOrders from "./Components/SellerOrders";
import SellerReturns from "./Components/SellerReturns";

// PHASE 20
import SellerAnalytics from "./Components/SellerAnalytics";

// PHASE 21
import SellerEarnings from "./Components/SellerEarnings";

import AdminDashboard from "./Components/AdminDashboard";
import AdminManagement from "./Components/AdminManagement";
import LiveChat from "./Components/LiveChat";
import DashboardShell from "./Components/DashboardShell";

// ============================================================
// API CONFIG
// (imported from ./config Ã¢â‚¬â€ see top of file)
// ============================================================

const GOOGLE_CLIENT_ID =
  "959578319636-bv6v5goamjj50tol638qvkt32f3shpja.apps.googleusercontent.com";

// ============================================================
// STORAGE HELPERS
// ============================================================

const readArrayFromStorage = (key) => {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Failed to read ${key}:`, error);
    return [];
  }
};

// ============================================================
// PRODUCT HELPERS
// ============================================================

const getProductName = (product) => {
  return (
    product?.title ||
    product?.name ||
    product?.productName ||
    "Unnamed Product"
  );
};

const getProductDescription = (product) => {
  return (
    product?.description ||
    product?.shortDescription ||
    "No description available."
  );
};

const getCategoryName = (product) => {
  if (!product?.category) {
    return "Uncategorized";
  }

  if (typeof product.category === "string") {
    return product.category;
  }

  return (
    product.category?.name ||
    product.category?.title ||
    product.category?.categoryName ||
    "Uncategorized"
  );
};

// ============================================================
// PRICE HELPERS
// ============================================================

const formatPrice = (price) => {
  const number = Number(price || 0);

  return `Rs. ${number.toLocaleString("en-PK")}`;
};

const getOriginalPrice = (product) => {
  const originalPrice =
    product?.originalPrice ||
    product?.compareAtPrice ||
    product?.oldPrice ||
    product?.discountPrice;

  const price = Number(product?.price || 0);

  if (!originalPrice || Number(originalPrice) <= price) {
    return null;
  }

  return Number(originalPrice);
};

const getDiscountPercentage = (product) => {
  const originalPrice = getOriginalPrice(product);
  const price = Number(product?.price || 0);

  if (!originalPrice || !price || originalPrice <= price) {
    return 0;
  }

  return Math.round(
    ((originalPrice - price) / originalPrice) * 100
  );
};

// ============================================================
// PHASE 14 - RATING HELPERS
// ============================================================

const getProductRating = (product) => {
  const rating = Number(
    product?.averageRating ??
    product?.rating ??
    product?.ratingsAverage ??
    product?.reviewsAverage ??
    0
  );

  if (Number.isNaN(rating)) {
    return 0;
  }

  return Math.max(0, Math.min(5, rating));
};

const getReviewCount = (product) => {
  return Number(
    product?.reviewCount ??
    product?.reviewsCount ??
    product?.ratingsQuantity ??
    product?.totalReviews ??
    0
  );
};

// ============================================================
// CATEGORY ICON
// ============================================================

const getCategoryIcon = (category) => {
  const name = String(
    typeof category === "string"
      ? category
      : category?.name ||
        category?.title ||
        category?.categoryName ||
        ""
  ).toLowerCase();

  if (name.includes("electronic")) return String.fromCodePoint(0x1F4BB);
  if (name.includes("mobile")) return String.fromCodePoint(0x1F4F1);
  if (name.includes("phone")) return String.fromCodePoint(0x1F4F1);
  if (name.includes("fashion")) return String.fromCodePoint(0x1F455);
  if (name.includes("cloth")) return String.fromCodePoint(0x1F457);
  if (name.includes("shoe")) return String.fromCodePoint(0x1F45F);
  if (name.includes("beauty")) return String.fromCodePoint(0x1F484);
  if (name.includes("home")) return String.fromCodePoint(0x1F3E0);
  if (name.includes("book")) return String.fromCodePoint(0x1F4DA);
  if (name.includes("sport")) return String.fromCodePoint(0x26BD);
  if (name.includes("grocery")) return String.fromCodePoint(0x1F6D2);
  if (name.includes("computer")) return String.fromCodePoint(0x1F5A5, 0xFE0F);
  if (name.includes("watch")) return String.fromCodePoint(0x231A);
  return String.fromCodePoint(0x1F6D2);
};
// ============================================================
// RATING STARS COMPONENT
// ============================================================

const RatingStars = ({ rating = 0 }) => {
  const roundedRating = Math.round(Number(rating || 0));

  return (
    <div
      className="rating-stars"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>
          {star <= roundedRating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
};

// ============================================================
// PRODUCT CARD
// ============================================================

function ProductCard({
  product,
  isWishlisted,
  onWishlist,
  onAddToCart,
  onViewDetails,
}) {
  const productName = getProductName(product);
  const rating = getProductRating(product);
  const reviewCount = getReviewCount(product);
  const originalPrice = getOriginalPrice(product);
  const discount = getDiscountPercentage(product);

  const stock = Number(product?.stock ?? 0);

  const image =
    product?.images?.[0] ||
    product?.image ||
    product?.thumbnail ||
    product?.photo;

  return (
    <article className="product-card">
      <div className="product-image-wrapper">
        <img
          src={getImageUrl(image)}
          alt={productName}
          className="product-image"
        />

        {discount > 0 && (
          <span className="discount-badge">
            -{discount}%
          </span>
        )}

        <button
          type="button"
          className={`wishlist-button ${isWishlisted ? String.fromCodePoint(0x2665) : String.fromCodePoint(0x2661)
            }`}
          onClick={() => onWishlist(product)}
          aria-label="Add to wishlist"
        >
          {isWishlisted ? String.fromCodePoint(0x2665) : String.fromCodePoint(0x2661)}
        </button>
      </div>

      <div className="product-card-content">
        <div className="product-category">
          {getCategoryName(product)}
        </div>

        <h3 className="product-title">
          {productName}
        </h3>

        <div className="product-rating-row">
          <RatingStars rating={rating} />

          <span className="review-count">
            ({reviewCount})
          </span>
        </div>

        <div className="product-price-row">
          <strong className="product-price">
            {formatPrice(product?.price)}
          </strong>

          {originalPrice && (
            <span className="original-price">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        <div className="product-stock">
          {stock > 0 ? (
            <span className="in-stock">
              {stock} in stock
            </span>
          ) : (
            <span className="out-of-stock">
              Out of stock
            </span>
          )}
        </div>

        <div className="product-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onViewDetails(product)}
          >
            Details
          </button>

          <button
            type="button"
            className="primary-button"
            disabled={stock <= 0}
            onClick={() => onAddToCart(product)}
          >
            {stock > 0 ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </div>
    </article>
  );
}

// ============================================================
// STORED ROLE (read-only, used only to decide which nav shortcuts to show)
// ============================================================

const getStoredRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.role || "";
  } catch {
    return "";
  }
};

// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  // ==========================================================
  // PHASE 05/06 - PRODUCTS + CATEGORIES
  // ==========================================================

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [adminRefreshKey, setAdminRefreshKey] = useState(0);

  // ==========================================================
  // PHASE 07 - CART + WISHLIST
  // ==========================================================

  const [cart, setCart] = useState(() =>
    readArrayFromStorage("cart")
  );

  const [wishlist, setWishlist] = useState(() =>
    readArrayFromStorage("wishlist")
  );

  // ==========================================================
  // SEARCH / FILTER / SORT
  // ==========================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [sortOption, setSortOption] =
    useState("default");

  // ==========================================================
  // CART MESSAGE
  // ==========================================================

  const [cartMessage, setCartMessage] = useState("");

  // ==========================================================
  // PHASE 09 - COUPON
  // ==========================================================

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] =
    useState(null);

  const [couponLoading, setCouponLoading] =
    useState(false);

  const [couponError, setCouponError] =
    useState("");

  // ==========================================================
  // PHASE 10 - PAYMENT
  // ==========================================================

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  const [paymentMessage, setPaymentMessage] =
    useState("");

  const [paymentMessageType, setPaymentMessageType] =
    useState("");

  // ==========================================================
  // PHASE 08 - CHECKOUT
  // ==========================================================

  const [checkoutOpen, setCheckoutOpen] =
    useState(false);

  const [orderLoading, setOrderLoading] =
    useState(false);

  const [orderMessage, setOrderMessage] =
    useState("");

  const [orderMessageType, setOrderMessageType] =
    useState("");

  const [shippingAddress, setShippingAddress] =
    useState({
      fullName: "",
      countryCode: "+92",
      phone: "",
      cnic: "",
      address: "",
      city: "",
      province: "",
      postalCode: "",
    });

  // ==========================================================
  // PHASE 11 - ORDERS
  // ==========================================================

  const [myOrders, setMyOrders] = useState([]);

  const [ordersLoading, setOrdersLoading] =
    useState(false);

  const [ordersError, setOrdersError] =
    useState("");

  const [returnOrder, setReturnOrder] =
    useState(null);

  // ==========================================================
  // PRODUCT DETAILS
  // ==========================================================

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [detailQuantity, setDetailQuantity] =
    useState(1);

  // ==========================================================
  // REFRESH
  // ==========================================================

  const [refreshKey, setRefreshKey] =
    useState(0);

  // ==========================================================
  // PHASE 15 - SELLER REFRESH
  // ==========================================================

  const [sellerRefreshKey, setSellerRefreshKey] =
    useState(0);

  // ==========================================================
  // GOOGLE LOGIN
  // ==========================================================

  const [googleLoading, setGoogleLoading] =
    useState(false);

  const [googleMessage, setGoogleMessage] =
    useState("");

  // SHOPMART_GOOGLE_ACCOUNT_STATE_FIX
  const [accountUser, setAccountUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [chatRefreshKey, setChatRefreshKey] =
    useState(0);
  // ==========================================================
  // TOKEN HELPER
  // ==========================================================

  const getAuthToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  };

  // ==========================================================
  // SAVE CART
  // ==========================================================

  useEffect(() => {
    localStorage.setItem(
      "cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  // ==========================================================
  // SAVE WISHLIST
  // ==========================================================

  useEffect(() => {
    localStorage.setItem(
      "wishlist",
      JSON.stringify(wishlist)
    );
  }, [wishlist]);

  // ==========================================================
  // FETCH PRODUCTS
  // ==========================================================

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/products`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
            "Failed to load products."
          );
        }

        const productList =
          data?.products ||
          data?.data ||
          [];

        setProducts(
          Array.isArray(productList)
            ? productList
            : []
        );
      } catch (err) {
        console.error(err);

        setError(
          err?.message ||
          "Unable to load products."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [refreshKey]);

  // ==========================================================
  // FETCH CATEGORIES
  // ==========================================================

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/categories`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
            "Failed to load categories."
          );
        }

        const categoryList =
          data?.categories ||
          data?.data ||
          [];

        setCategories(
          Array.isArray(categoryList)
            ? categoryList
            : []
        );
      } catch (err) {
        console.error(
          "Category fetch error:",
          err
        );
      }
    };

    fetchCategories();
  }, [refreshKey]);

  // ==========================================================
  // PHASE 11 - FETCH MY ORDERS
  // ==========================================================

  useEffect(() => {
    const fetchMyOrders = async () => {
      const token = getAuthToken();

      if (!token) {
        setMyOrders([]);
        return;
      }

      try {
        setOrdersLoading(true);
        setOrdersError("");

        const response = await fetch(
          `${API_BASE_URL}/api/orders/my-orders`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          handleAuthResponse(response);
          throw new Error(
            data?.message ||
            "Failed to load orders."
          );
        }

        const orders =
          data?.orders ||
          data?.data ||
          [];

        setMyOrders(
          Array.isArray(orders)
            ? orders
            : []
        );
      } catch (err) {
        console.error(err);

        setOrdersError(
          err?.message ||
          "Unable to load your orders."
        );
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchMyOrders();
  }, [refreshKey]);

  // ==========================================================
  // GOOGLE LOGIN SCRIPT
  // ==========================================================

  useEffect(() => {
    const existingScript =
      document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );

    if (existingScript) {
      return;
    }

    const script =
      document.createElement("script");

    script.src =
      "https://accounts.google.com/gsi/client";

    script.async = true;
    script.defer = true;

    document.body.appendChild(script);

    return () => {
      if (
        document.body.contains(script)
      ) {
        document.body.removeChild(
          script
        );
      }
    };
  }, []);

  // ==========================================================
  // FILTERED PRODUCTS
  // ==========================================================

  const filteredProducts = useMemo(() => {
    let result = [...products];

    const search = searchTerm
      .trim()
      .toLowerCase();

    if (search) {
      result = result.filter(
        (product) => {
          const name =
            getProductName(
              product
            ).toLowerCase();

          const description =
            getProductDescription(
              product
            ).toLowerCase();

          const category =
            getCategoryName(
              product
            ).toLowerCase();

          return (
            name.includes(search) ||
            description.includes(
              search
            ) ||
            category.includes(search)
          );
        }
      );
    }

    if (
      selectedCategory !== "all"
    ) {
      result = result.filter(
        (product) => {
          const productCategory =
            product?.category;

          if (
            typeof productCategory ===
            "string"
          ) {
            return (
              productCategory ===
              selectedCategory ||
              productCategory
                .toLowerCase()
                .includes(
                  String(
                    selectedCategory
                  ).toLowerCase()
                )
            );
          }

          const categoryId =
            productCategory?._id;

          const categoryName =
            productCategory?.name ||
            productCategory?.title;

          return (
            categoryId ===
            selectedCategory ||
            categoryName ===
            selectedCategory
          );
        }
      );
    }

    if (
      sortOption === "price-low"
    ) {
      result.sort(
        (a, b) =>
          Number(a?.price || 0) -
          Number(b?.price || 0)
      );
    }

    if (
      sortOption === "price-high"
    ) {
      result.sort(
        (a, b) =>
          Number(b?.price || 0) -
          Number(a?.price || 0)
      );
    }

    if (sortOption === "rating") {
      result.sort(
        (a, b) =>
          getProductRating(b) -
          getProductRating(a)
      );
    }

    if (sortOption === "name") {
      result.sort((a, b) =>
        getProductName(
          a
        ).localeCompare(
          getProductName(b)
        )
      );
    }

    return result;
  }, [
    products,
    searchTerm,
    selectedCategory,
    sortOption,
  ]);

  // ==========================================================
  // CART SUBTOTAL
  // ==========================================================

  const cartSubtotal = useMemo(() => {
    return cart.reduce(
      (total, item) => {
        return (
          total +
          Number(
            item?.price || 0
          ) *
          Number(
            item?.quantity || 1
          )
        );
      },
      0
    );
  }, [cart]);

  // ==========================================================
  // COUPON DISCOUNT
  // ==========================================================

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) {
      return 0;
    }

    const directDiscount =
      Number(
        appliedCoupon?.discountAmount ||
        appliedCoupon?.discount ||
        0
      );

    if (directDiscount > 0) {
      return Math.min(
        directDiscount,
        cartSubtotal
      );
    }

    const percentage =
      Number(
        appliedCoupon?.discountPercentage ||
        appliedCoupon?.percentage ||
        0
      );

    if (percentage > 0) {
      return Math.min(
        (cartSubtotal *
          percentage) /
        100,
        cartSubtotal
      );
    }

    return 0;
  }, [
    appliedCoupon,
    cartSubtotal,
  ]);

  const cartTotal = Math.max(
    0,
    cartSubtotal -
    discountAmount
  );

  // ==========================================================
  // LAYOUT STATE (navigation drawer + dashboard workspaces)
  // ==========================================================

  const [navOpen, setNavOpen] = useState(false);
  const [workspace, setWorkspace] = useState("store");
  const [sellerTab, setSellerTab] = useState("dashboard");
  const [adminTab, setAdminTab] = useState("overview");

  // ==========================================================
  // SCROLL HELPER
  // ==========================================================

  const scrollToSection = (id) => {
    const element =
      document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // ==========================================================
  // CART - ADD
  // ==========================================================

  const addToCart = (
    product,
    quantity = 1
  ) => {
    const productId =
      product?._id;

    if (!productId) {
      return;
    }

    const availableStock =
      Number(
        product?.stock ?? 0
      );

    if (availableStock <= 0) {
      setCartMessage(
        "This product is out of stock."
      );

      setTimeout(
        () =>
          setCartMessage(""),
        2500
      );

      return;
    }

    setCart((currentCart) => {
      const existing =
        currentCart.find(
          (item) =>
            item?._id ===
            productId
        );

      if (existing) {
        const newQuantity =
          Number(
            existing.quantity || 1
          ) +
          Number(quantity || 1);

        if (
          newQuantity >
          availableStock
        ) {
          setCartMessage(
            `Only ${availableStock} item(s) available.`
          );

          return currentCart;
        }

        return currentCart.map(
          (item) =>
            item?._id ===
              productId
              ? {
                ...item,
                quantity:
                  newQuantity,
              }
              : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity:
            Number(quantity) || 1,
        },
      ];
    });

    setCartMessage(
      `${getProductName(
        product
      )} added to cart.`
    );

    setTimeout(
      () =>
        setCartMessage(""),
      2500
    );
  };

  // ==========================================================
  // CART - UPDATE
  // ==========================================================

  const updateCartQuantity = (
    productId,
    quantity
  ) => {
    const newQuantity =
      Number(quantity);

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((currentCart) =>
      currentCart.map(
        (item) => {
          if (
            item?._id !==
            productId
          ) {
            return item;
          }

          const stock =
            Number(
              item?.stock ??
              999999
            );

          return {
            ...item,
            quantity:
              Math.min(
                newQuantity,
                stock
              ),
          };
        }
      )
    );
  };

  // ==========================================================
  // CART - REMOVE
  // ==========================================================

  const removeFromCart = (
    productId
  ) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item?._id !==
          productId
      )
    );
  };

  // ==========================================================
  // WISHLIST
  // ==========================================================

  const toggleWishlist = (
    product
  ) => {
    const productId =
      product?._id;

    if (!productId) {
      return;
    }

    setWishlist(
      (currentWishlist) => {
        const exists =
          currentWishlist.some(
            (item) =>
              item?._id ===
              productId
          );

        if (exists) {
          return currentWishlist.filter(
            (item) =>
              item?._id !==
              productId
          );
        }

        return [
          ...currentWishlist,
          product,
        ];
      }
    );
  };

  // ==========================================================
  // COUPON APPLY
  // ==========================================================

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError(
        "Please enter a coupon code."
      );

      return;
    }

    try {
      setCouponLoading(true);
      setCouponError("");

      const response =
        await fetch(
          `${API_BASE_URL}/api/coupons/apply`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              code:
                couponCode.trim(),
              orderAmount:
                cartSubtotal,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          "Invalid coupon."
        );
      }

      const coupon =
        data?.coupon ||
        data?.data ||
        data;

      setAppliedCoupon(
        coupon
      );

      setCouponError("");

      setCartMessage(
        "Coupon applied successfully."
      );

      setTimeout(
        () =>
          setCartMessage(""),
        2500
      );
    } catch (err) {
      console.error(err);

      setAppliedCoupon(null);

      setCouponError(
        err?.message ||
        "Unable to apply coupon."
      );
    } finally {
      setCouponLoading(false);
    }
  };

  // ==========================================================
  // REMOVE COUPON
  // ==========================================================

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  // ==========================================================
  // CHECKOUT OPEN
  // ==========================================================

  const openCheckout = () => {
    if (!cart.length) {
      setCartMessage(
        "Your cart is empty."
      );

      setTimeout(
        () =>
          setCartMessage(""),
        2500
      );

      return;
    }

    const token =
      getAuthToken();

    if (!token) {
      setCartMessage(
        "Please login before checkout."
      );

      setTimeout(
        () =>
          setCartMessage(""),
        3000
      );

      return;
    }

    setOrderMessage("");
    setOrderMessageType("");

    setCheckoutOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================================
  // SHIPPING ADDRESS CHANGE
  // ==========================================================

  const handleShippingChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setShippingAddress(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  };

  // ==========================================================
  // VALIDATE SHIPPING
  // ==========================================================

  const validateShippingAddress =
    () => {
      const requiredFields = [
        "fullName",
        "phone",
        "cnic",
        "address",
        "city",
        "province",
        "postalCode",
      ];

      for (
        const field of requiredFields
      ) {
        if (
          !String(
            shippingAddress?.[
            field
            ] || ""
          ).trim()
        ) {
          return false;
        }
      }

      return true;
    };

  // ==========================================================
  // PHASE 11 - CREATE COD ORDER
  // ==========================================================

  const createCodOrder =
    async () => {
      const token =
        getAuthToken();

      if (!token) {
        setOrderMessage(
          "Please login before placing an order."
        );

        setOrderMessageType(
          "error"
        );

        return;
      }

      if (!cart.length) {
        setOrderMessage(
          "Your cart is empty."
        );

        setOrderMessageType(
          "error"
        );

        return;
      }

      if (
        !validateShippingAddress()
      ) {
        setOrderMessage(
          "Please fill all shipping fields."
        );

        setOrderMessageType(
          "error"
        );

        return;
      }

      try {
        setOrderLoading(true);
        setOrderMessage("");
        setOrderMessageType("");

        const response =
          await fetch(
            `${API_BASE_URL}/api/orders`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                items: cart.map(
                  (item) => ({
                    product:
                      item?._id,
                    quantity:
                      Number(
                        item?.quantity ||
                        1
                      ),
                    price:
                      Number(
                        item?.price ||
                        0
                      ),
                  })
                ),

                shippingAddress,

                paymentMethod:
                  "cod",

                couponCode:
                  appliedCoupon?.code ||
                  couponCode.trim() ||
                  undefined,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
            "Failed to create order."
          );
        }

        setOrderMessage(
          "Order placed successfully!"
        );

        setOrderMessageType(
          "success"
        );

        setCart([]);

        setAppliedCoupon(null);
        setCouponCode("");

        setRefreshKey(
          (value) =>
            value + 1
        );

        setTimeout(() => {
          setCheckoutOpen(false);
        }, 1200);
      } catch (err) {
        console.error(err);

        setOrderMessage(
          err?.message ||
          "Unable to place order."
        );

        setOrderMessageType(
          "error"
        );
      } finally {
        setOrderLoading(false);
      }
    };

  // ==========================================================
  // PHASE 10 - STRIPE CHECKOUT
  // ==========================================================

  const startStripeCheckout =
    async () => {
      if (!cart.length) {
        setPaymentMessage(
          "Your cart is empty."
        );

        setPaymentMessageType(
          "error"
        );

        return;
      }

      const token = getAuthToken();

      if (!token) {
        setPaymentMessage(
          "Please login before paying with Stripe."
        );

        setPaymentMessageType(
          "error"
        );

        return;
      }

      if (!validateShippingAddress()) {
        setPaymentMessage(
          "Please fill all shipping fields before paying with Stripe."
        );

        setPaymentMessageType(
          "error"
        );

        return;
      }

      try {
        setPaymentLoading(true);
        setPaymentMessage("");
        setPaymentMessageType("");

        const response =
          await fetch(
            `${API_BASE_URL}/api/payments/create-checkout-session`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                items: cart.map(
                  (item) => ({
                    productId:
                      item?._id,
                    quantity:
                      Number(
                        item?.quantity ||
                        1
                      ),
                  })
                ),

                shippingAddress,

                couponCode:
                  appliedCoupon?.code ||
                  couponCode.trim() ||
                  undefined,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
            "Unable to start payment."
          );
        }

        if (data?.url) {
          window.location.href =
            data.url;

          return;
        }

        throw new Error(
          "Payment URL was not returned."
        );
      } catch (err) {
        console.error(err);

        setPaymentMessage(
          err?.message ||
          "Payment could not be started."
        );

        setPaymentMessageType(
          "error"
        );
      } finally {
        setPaymentLoading(false);
      }
    };

  // ==========================================================
  // PHASE 10 - VERIFY STRIPE PAYMENT
  // ==========================================================

  useEffect(() => {
    const verifyPayment =
      async () => {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const payment =
          params.get(
            "payment"
          );

        const sessionId =
          params.get(
            "session_id"
          );

        if (
          payment !== "success" ||
          !sessionId
        ) {
          return;
        }

        try {
          const token = getAuthToken();

          const response =
            await fetch(
              `${API_BASE_URL}/api/payments/session/${sessionId}`,
              {
                headers: token
                  ? { Authorization: `Bearer ${token}` }
                  : {},
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data?.message ||
              "Payment verification failed."
            );
          }

          // The real field is data.payment.status ("paid") - the
          // payment record returned by the backend, not a
          // top-level status field.
          if (data?.payment?.status === "paid") {
            setCart([]);

            setPaymentMessage(
              data?.order
                ? "Payment successful. Your order has been placed."
                : "Payment successful, but your order is being finalized. Please check My Orders shortly."
            );

            setPaymentMessageType(
              "success"
            );

            setRefreshKey(
              (value) =>
                value + 1
            );
          } else if (
            data?.payment?.status === "failed" ||
            data?.payment?.status === "cancelled"
          ) {
            setPaymentMessage(
              "Payment was not completed."
            );

            setPaymentMessageType(
              "error"
            );
          }

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        } catch (err) {
          console.error(err);

          setPaymentMessage(
            err?.message ||
            "Unable to verify payment."
          );

          setPaymentMessageType(
            "error"
          );
        }
      };

    verifyPayment();
  }, []);

  // ==========================================================
  // PRODUCT DETAILS
  // ==========================================================

  const openProductDetails = (
    product
  ) => {
    setSelectedProduct(
      product
    );

    setDetailQuantity(1);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================================
  // PHASE 14 - REVIEW SUBMITTED
  // ==========================================================

  const handleReviewSubmitted =
    async () => {
      setRefreshKey(
        (value) => value + 1
      );

      if (
        !selectedProduct?._id
      ) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/products/${selectedProduct._id}`
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        const updatedProduct =
          data?.product ||
          data?.data ||
          data;

        if (
          updatedProduct &&
          updatedProduct?._id
        ) {
          setSelectedProduct(
            updatedProduct
          );
        }
      } catch (error) {
        console.error(
          "Failed to refresh product:",
          error
        );
      }
    };

  // ==========================================================
  // GOOGLE LOGIN
  // ==========================================================

  const handleGoogleLogin =
    async (response) => {
      if (
        !response?.credential
      ) {
        return;
      }

      try {
        setGoogleLoading(true);
        setGoogleMessage("");

        const result =
          await fetch(
            `${API_BASE_URL}/api/users/google-login`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                token:
                  response.credential,
              }),
            }
          );

        const data =
          await result.json();

        if (!result.ok) {
          throw new Error(
            data?.message ||
            "Google login failed."
          );
        }

        if (data?.token) {
          localStorage.setItem(
            "token",
            data.token
          );
        }

        if (data?.user) {
          localStorage.setItem(
            "user",
            JSON.stringify(
              data.user
            )
          );
        }

        // SHOPMART_GOOGLE_ACCOUNT_STATE_FIX
        setAccountUser(data?.user || null);

        setGoogleMessage(
          "Google login successful."
        );

        setRefreshKey(
          (value) => value + 1
        );

        setChatRefreshKey((value) => value + 1);
      } catch (err) {
        console.error(err);

        setGoogleMessage(
          err?.message ||
          "Google login failed."
        );
      } finally {
        setGoogleLoading(false);
      }
    };

  // ==========================================================
  // GOOGLE BUTTON INITIALIZATION
  // ==========================================================

  useEffect(() => {
    let cancelled = false;
    let timer;

    const initializeGoogle = () => {
      if (cancelled) return;

      if (
        !window.google ||
        !window.google.accounts ||
        !window.google.accounts.id
      ) {
        timer = setTimeout(initializeGoogle, 500);
        return;
      }

      const container = document.getElementById(
        "google-login-button"
      );

      if (!container || cancelled) return;

      container.innerHTML = "";

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
      });

      window.google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        width: 300,
        text: "continue_with",
        shape: "rectangular",
      });
    };

    timer = setTimeout(initializeGoogle, 1200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // ==========================================================
  // PHASE 15 - SELLER SUBMITTED
  // ==========================================================

  const handleSellerSubmitted =
    () => {
      setSellerRefreshKey(
        (value) => value + 1
      );

      setRefreshKey(
        (value) => value + 1
      );

      setChatRefreshKey((value) => value + 1);
    };

  // ==========================================================
  // SHARED NAVBAR + DASHBOARD WORKSPACES (layout only)
  // ==========================================================

  const closeNav = () => setNavOpen(false);

  const goToSection = (id) => {
    setNavOpen(false);

    if (selectedProduct) {
      setSelectedProduct(null);
      setTimeout(() => scrollToSection(id), 100);
      return;
    }

    scrollToSection(id);
  };

  const openWorkspace = (name, tab) => {
    setNavOpen(false);
    setSelectedProduct(null);

    if (name === "seller" && tab) setSellerTab(tab);
    if (name === "admin" && tab) setAdminTab(tab);

    setWorkspace(name);
    window.scrollTo({ top: 0 });
  };

  const closeWorkspace = () => {
    setWorkspace("store");
    window.scrollTo({ top: 0 });
  };

  const currentRole = getStoredRole();

  const renderNavbar = () => (
    <header className="navbar">
      <div className="navbar-container">
        <button
          type="button"
          className="logo"
          onClick={() => goToSection("home")}
        >
          ShopMart
        </button>

        <form
          className="nav-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            goToSection("shop");
          }}
        >
          <input
            type="search"
            placeholder="Search products..."
            aria-label="Search products"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />
        </form>

        <button
          type="button"
          className="nav-toggle"
          aria-label="Open menu"
          aria-expanded={navOpen}
          onClick={() => setNavOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>

        <div
          className={`nav-backdrop ${navOpen ? "visible" : ""}`}
          onClick={closeNav}
        />

        <nav
          className={`nav-links ${navOpen ? "open" : ""}`}
          aria-label="Main"
        >
          <button
            type="button"
            className="nav-drawer-close"
            aria-label="Close menu"
            onClick={closeNav}
          >
            ×
          </button>

          <button type="button" onClick={() => goToSection("home")}>
            Home
          </button>

          <button type="button" onClick={() => goToSection("shop")}>
            Shop
          </button>

          <button type="button" onClick={() => goToSection("categories")}>
            Categories
          </button>

          <button type="button" onClick={() => goToSection("wishlist")}>
            Wishlist
            <span className="nav-count">{wishlist.length}</span>
          </button>

          <button type="button" onClick={() => goToSection("cart")}>
            Cart
            <span className="nav-count">{cart.length}</span>
          </button>

          <button type="button" onClick={() => goToSection("orders")}>
            Orders
          </button>

          <button type="button" onClick={() => goToSection("notifications")}>
            Notifications
          </button>

          <button type="button" onClick={() => goToSection("live-chat")}>
            Live Chat
          </button>

          {currentRole === "admin" && (
            <button
              type="button"
              onClick={() => openWorkspace("admin", "overview")}
            >
              Admin
            </button>
          )}

          <button
            type="button"
            className="navbar-link navbar-button-link"
            onClick={() =>
              openWorkspace(
                "seller",
                currentRole === "vendor" ? "dashboard" : "registration"
              )
            }
          >
            {currentRole === "vendor"
              ? "Seller Dashboard"
              : "Become a Seller"}
          </button>

          <button
            type="button"
            className="nav-signin"
            onClick={() => goToSection("login")}
          >
            Sign in
          </button>
        </nav>
      </div>
    </header>
  );

  const sellerNavGroups = [
    {
      label: "Overview",
      items: [{ id: "dashboard", label: "Dashboard", icon: String.fromCodePoint(0x1F4CA) }],
    },
    {
      label: "Store",
      items: [
        { id: "products", label: "Products", icon: String.fromCodePoint(0x1F4E6) },
        { id: "orders", label: "Orders", icon: String.fromCodePoint(0x1F9FE) },
        { id: "returns", label: "Returns", icon: String.fromCodePoint(0x21A9) },
      ],
    },
    {
      label: "Insights",
      items: [
        { id: "analytics", label: "Analytics", icon: String.fromCodePoint(0x1F4C8) },
        { id: "earnings", label: "Earnings", icon: String.fromCodePoint(0x1F4B0) },
      ],
    },
    {
      label: "Help",
      items: [
        { id: "support", label: "Support & Notifications", icon: String.fromCodePoint(0x1F6DF) },
      ],
    },
    {
      label: "Account",
      items: [
        { id: "registration", label: "Registration", icon: String.fromCodePoint(0x1F4DD) },
        { id: "status", label: "Application Status", icon: String.fromCodePoint(0x2705) },
      ],
    },
  ];

  const adminNavGroups = [
    {
      label: "Overview",
      items: [{ id: "overview", label: "Dashboard", icon: String.fromCodePoint(0x1F4CA) }],
    },
    {
      label: "Management",
      items: [
        { id: "users", label: "Users", icon: String.fromCodePoint(0x1F465) },
        { id: "sellers", label: "Sellers", icon: "Ã°Å¸ÂÂª" },
        { id: "products", label: "Products", icon: String.fromCodePoint(0x1F4E6) },
        { id: "orders", label: "Orders", icon: String.fromCodePoint(0x1F9FE) },
        { id: "returns", label: "Returns", icon: String.fromCodePoint(0x21A9) },
        { id: "support", label: "Support", icon: String.fromCodePoint(0x1F6DF) },
        { id: "chat", label: "Live Chat", icon: String.fromCodePoint(0x1F4AC) },
      ],
    },
  ];

  const renderSellerTab = () => {
    switch (sellerTab) {
      case "products":
        return <SellerProducts refreshKey={sellerRefreshKey} />;
      case "orders":
        return <SellerOrders refreshKey={sellerRefreshKey} />;
      case "returns":
        return <SellerReturns refreshKey={sellerRefreshKey} />;
      case "analytics":
        return <SellerAnalytics refreshKey={sellerRefreshKey} />;
      case "earnings":
        return <SellerEarnings refreshKey={sellerRefreshKey} />;
      case "support":
        return (
          <>
            <NotificationPanel />
            <SellerSupport refreshKey={sellerRefreshKey} />
          </>
        );
      case "registration":
        return (
          <SellerRegistration onSubmitted={handleSellerSubmitted} />
        );
      case "status":
        return (
          <div className="seller-status-wrapper">
            <SellerStatus refreshKey={sellerRefreshKey} />
          </div>
        );
      default:
        return <SellerDashboard refreshKey={sellerRefreshKey} />;
    }
  };

  const renderAdminTab = () =>
    adminTab === "chat" ? (
      <LiveChat refreshKey={adminRefreshKey} adminMode />
    ) : adminTab === "overview" ? (
      <AdminDashboard refreshKey={adminRefreshKey} />
    ) : (
      <AdminManagement
        refreshKey={adminRefreshKey}
        activeTab={adminTab}
        hideTabs
      />
    );

  if (workspace === "seller" || workspace === "admin") {
    const isSeller = workspace === "seller";

    return (
      <div className="app dash-app">
        <DashboardShell
          brand="ShopMart"
          badge={isSeller ? "Seller" : "Admin"}
          groups={isSeller ? sellerNavGroups : adminNavGroups}
          activeId={isSeller ? sellerTab : adminTab}
          onSelect={isSeller ? setSellerTab : setAdminTab}
          onExit={closeWorkspace}
          exitLabel="Back to store"
          subtitle={
            isSeller ? "Manage your shop" : "Platform administration"
          }
        >
          {isSeller ? renderSellerTab() : renderAdminTab()}
        </DashboardShell>
      </div>
    );
  }

  // ==========================================================
  // PRODUCT DETAILS PAGE
  // ==========================================================

  if (selectedProduct) {
    const stock = Number(
      selectedProduct?.stock ?? 0
    );

    const rating =
      getProductRating(
        selectedProduct
      );

    const reviewCount =
      getReviewCount(
        selectedProduct
      );

    const image =
      selectedProduct?.images?.[0] ||
      selectedProduct?.image ||
      selectedProduct?.thumbnail;

    const originalPrice =
      getOriginalPrice(
        selectedProduct
      );

    const discount =
      getDiscountPercentage(
        selectedProduct
      );

    return (
      <div className="app">

        {/* ====================================================
            PRODUCT DETAILS NAVBAR
        ==================================================== */}

        {renderNavbar()}

        {/* ====================================================
            PRODUCT DETAILS
        ==================================================== */}

        <main className="product-details-page">

          <div className="container">

            <button
              type="button"
              className="back-button"
              onClick={() =>
                setSelectedProduct(
                  null
                )
              }
            >
              Ã¢â€ Â Back to Shop
            </button>

            <div className="product-details-grid">

              <div className="product-details-image">

                <img
                  src={getImageUrl(
                    image
                  )}
                  alt={getProductName(
                    selectedProduct
                  )}
                />

                {discount > 0 && (
                  <span className="discount-badge">
                    -{discount}%
                  </span>
                )}

              </div>

              <div className="product-details-content">

                <div className="product-category">
                  {getCategoryName(
                    selectedProduct
                  )}
                </div>

                <h1>
                  {getProductName(
                    selectedProduct
                  )}
                </h1>

                <div className="product-rating-row">

                  <RatingStars
                    rating={rating}
                  />

                  <span>
                    {rating.toFixed(
                      1
                    )}
                  </span>

                  <span>
                    ({reviewCount} reviews)
                  </span>

                </div>

                <div className="details-price">

                  <strong>
                    {formatPrice(
                      selectedProduct?.price
                    )}
                  </strong>

                  {originalPrice && (
                    <span className="original-price">
                      {formatPrice(
                        originalPrice
                      )}
                    </span>
                  )}

                </div>

                <p className="product-description">
                  {getProductDescription(
                    selectedProduct
                  )}
                </p>

                <div className="details-stock">
                  {stock > 0
                    ? `${stock} items available`
                    : "Out of stock"}
                </div>

                {stock > 0 && (
                  <div className="quantity-control">

                    <button
                      type="button"
                      onClick={() =>
                        setDetailQuantity(
                          (value) =>
                            Math.max(
                              1,
                              value - 1
                            )
                        )
                      }
                    >
                      −
                    </button>

                    <span>
                      {detailQuantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setDetailQuantity(
                          (value) =>
                            Math.min(
                              stock,
                              value + 1
                            )
                        )
                      }
                    >
                      +
                    </button>

                  </div>
                )}

                <div className="details-actions">

                  <button
                    type="button"
                    className="primary-button"
                    disabled={
                      stock <= 0
                    }
                    onClick={() =>
                      addToCart(
                        selectedProduct,
                        detailQuantity
                      )
                    }
                  >
                    Add to Cart
                  </button>

                  <button
                    type="button"
                    className={`secondary-button ${wishlist.some(
                      (item) =>
                        item?._id ===
                        selectedProduct?._id
                    )
                      ? "active"
                      : ""
                      }`}
                    onClick={() =>
                      toggleWishlist(
                        selectedProduct
                      )
                    }
                  >
                    {wishlist.some(
                      (item) =>
                        item?._id ===
                        selectedProduct?._id
                    )
                      ? "Ã¢â„¢Â¥ Wishlisted"
                      : "Ã¢â„¢Â¡ Wishlist"}
                  </button>

                </div>

              </div>

            </div>

            {/* ==================================================
                PHASE 14 - REVIEWS
            ================================================== */}

            <section className="reviews-section">

              <ReviewSection
                productId={
                  selectedProduct?._id
                }
                product={
                  selectedProduct
                }
                onReviewSubmitted={
                  handleReviewSubmitted
                }
              />

            </section>

          </div>

        </main>

      </div>
    );
  }

  // ==========================================================
  // MAIN SHOP PAGE
  // ==========================================================

  return (
    <div className="app">

      {/* ======================================================
          NAVBAR
      ====================================================== */}

      {renderNavbar()}

      {/* ======================================================
          CART MESSAGE
      ====================================================== */}

      {cartMessage && (
        <div className="toast-message">
          {cartMessage}
        </div>
      )}

      {/* ======================================================
          PAYMENT MESSAGE
      ====================================================== */}

      {paymentMessage && (
        <div
          className={`status-message ${paymentMessageType}`}
        >
          {paymentMessage}
        </div>
      )}

      {/* ======================================================
          HERO
      ====================================================== */}

      <section
        id="home"
        className="hero-section"
      >

        <div className="container hero-content">

          <div className="hero-text">

            <span className="section-label">
              Welcome to ShopMart
            </span>

            <h1>
              Everything You Need,
              <br />
              All in One Place.
            </h1>

            <p>
              Discover quality products,
              great prices and a smooth
              shopping experience.
            </p>

            <div className="hero-actions">

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  scrollToSection(
                    "shop"
                  )
                }
              >
                Shop Now
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  openWorkspace("seller", "registration")
                }
              >
                Sell on ShopMart
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          CATEGORIES
      ====================================================== */}

      <section
        id="categories"
        className="section"
      >

        <div className="container">

          <div className="section-heading">

            <span className="section-label">
              Categories
            </span>

            <h2>
              Shop by Category
            </h2>

            <p>
              Find products from your
              favorite categories.
            </p>

          </div>

          <div className="category-grid">

            <button
              type="button"
              className={`category-card ${selectedCategory ===
                "all"
                ? "active"
                : ""
                }`}
              onClick={() => {
                setSelectedCategory(
                  "all"
                );

                scrollToSection(
                  "shop"
                );
              }}
            >

              <span className="category-icon">{String.fromCodePoint(0x1F6D2)}</span>

              <span>
                All Products
              </span>

            </button>

            {categories.map(
              (category) => {
                const categoryId =
                  category?._id;

                return (
                  <button
                    type="button"
                    className={`category-card ${selectedCategory ===
                      categoryId
                      ? "active"
                      : ""
                      }`}
                    key={
                      categoryId ||
                      category?.name
                    }
                    onClick={() => {
                      setSelectedCategory(
                        categoryId
                      );

                      scrollToSection(
                        "shop"
                      );
                    }}
                  >

                    <span className="category-icon">
                      {getCategoryIcon(
                        category
                      )}
                    </span>

                    <span>
                      {category?.name ||
                        category?.title ||
                        "Category"}
                    </span>

                  </button>
                );
              }
            )}

          </div>

        </div>

      </section>

      {/* ======================================================
          SHOP
      ====================================================== */}

      <section
        id="shop"
        className="section"
      >

        <div className="container">

          <div className="section-heading">

            <span className="section-label">
              Shop
            </span>

            <h2>
              Explore Products
            </h2>

            <p>
              Search, filter and sort
              products.
            </p>

          </div>

          <div className="shop-controls">

            <div className="search-box">

              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />

            </div>

            <select
              value={sortOption}
              onChange={(event) =>
                setSortOption(
                  event.target.value
                )
              }
            >

              <option value="default">
                Sort by
              </option>

              <option value="price-low">
                Price: Low to High
              </option>

              <option value="price-high">
                Price: High to Low
              </option>

              <option value="rating">
                Rating
              </option>

              <option value="name">
                Name
              </option>

            </select>

          </div>

          {loading && (
            <div className="loading-state">
              Loading products...
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            filteredProducts.length ===
            0 && (
              <div className="empty-state">
                No products found.
              </div>
            )}

          {!loading &&
            filteredProducts.length >
            0 && (
              <div className="product-grid">

                {filteredProducts.map(
                  (product) => (
                    <ProductCard
                      key={
                        product?._id
                      }
                      product={
                        product
                      }
                      isWishlisted={wishlist.some(
                        (item) =>
                          item?._id ===
                          product?._id
                      )}
                      onWishlist={
                        toggleWishlist
                      }
                      onAddToCart={
                        addToCart
                      }
                      onViewDetails={
                        openProductDetails
                      }
                    />
                  )
                )}

              </div>
            )}

        </div>

      </section>

      {/* ======================================================
          WISHLIST
      ====================================================== */}

      <section
        id="wishlist"
        className="section"
      >

        <div className="container">

          <div className="section-heading">

            <span className="section-label">
              Wishlist
            </span>

            <h2>
              Your Wishlist
            </h2>

          </div>

          {wishlist.length ===
            0 ? (
            <div className="empty-state">
              Your wishlist is empty.
            </div>
          ) : (
            <div className="product-grid">

              {wishlist.map(
                (product) => (
                  <ProductCard
                    key={
                      product?._id
                    }
                    product={
                      product
                    }
                    isWishlisted={
                      true
                    }
                    onWishlist={
                      toggleWishlist
                    }
                    onAddToCart={
                      addToCart
                    }
                    onViewDetails={
                      openProductDetails
                    }
                  />
                )
              )}

            </div>
          )}

        </div>

      </section>

      {/* ======================================================
          CART
      ====================================================== */}

      <section
        id="cart"
        className="section cart-section"
      >

        <div className="container">

          <div className="section-heading">

            <span className="section-label">
              Cart
            </span>

            <h2>
              Your Shopping Cart
            </h2>

          </div>

          {cart.length ===
            0 ? (
            <div className="empty-state">
              Your cart is empty.
            </div>
          ) : (
            <div className="cart-layout">

              <div className="cart-items">

                {cart.map(
                  (item) => (
                    <div
                      className="cart-item"
                      key={
                        item?._id
                      }
                    >

                      <img
                        src={getImageUrl(
                          item?.images?.[0] ||
                          item?.image ||
                          item?.thumbnail
                        )}
                        alt={getProductName(
                          item
                        )}
                      />

                      <div className="cart-item-info">

                        <h3>
                          {getProductName(
                            item
                          )}
                        </h3>

                        <p>
                          {formatPrice(
                            item?.price
                          )}
                        </p>

                        <div className="cart-quantity">

                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                item?._id,
                                Number(
                                  item?.quantity ||
                                  1
                                ) - 1
                              )
                            }
                          >
                            −
                          </button>

                          <span>
                            {item?.quantity ||
                              1}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                item?._id,
                                Number(
                                  item?.quantity ||
                                  1
                                ) + 1
                              )
                            }
                          >
                            +
                          </button>

                        </div>

                      </div>

                      <div className="cart-item-total">

                        <strong>
                          {formatPrice(
                            Number(
                              item?.price ||
                              0
                            ) *
                            Number(
                              item?.quantity ||
                              1
                            )
                          )}
                        </strong>

                        <button
                          type="button"
                          className="remove-button"
                          onClick={() =>
                            removeFromCart(
                              item?._id
                            )
                          }
                        >
                          Remove
                        </button>

                      </div>

                    </div>
                  )
                )}

              </div>

              {/* ORDER SUMMARY */}

              <aside className="cart-summary">

                <h3>
                  Order Summary
                </h3>

                <div className="summary-row">

                  <span>
                    Subtotal
                  </span>

                  <strong>
                    {formatPrice(
                      cartSubtotal
                    )}
                  </strong>

                </div>

                <div className="coupon-box">

                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={
                      couponCode
                    }
                    onChange={(
                      event
                    ) =>
                      setCouponCode(
                        event.target
                          .value
                      )
                    }
                  />

                  <button
                    type="button"
                    onClick={
                      applyCoupon
                    }
                    disabled={
                      couponLoading
                    }
                  >
                    {couponLoading
                      ? "..."
                      : "Apply"}
                  </button>

                </div>

                {couponError && (
                  <p className="error-text">
                    {couponError}
                  </p>
                )}

                {appliedCoupon && (
                  <div className="applied-coupon">

                    <span>
                      Coupon applied
                    </span>

                    <button
                      type="button"
                      onClick={
                        removeCoupon
                      }
                    >
                      Remove
                    </button>

                  </div>
                )}

                {discountAmount >
                  0 && (
                    <div className="summary-row discount-row">

                      <span>
                        Discount
                      </span>

                      <strong>
                        -
                        {formatPrice(
                          discountAmount
                        )}
                      </strong>

                    </div>
                  )}

                <div className="summary-total">

                  <span>
                    Total
                  </span>

                  <strong>
                    {formatPrice(
                      cartTotal
                    )}
                  </strong>

                </div>

                <button
                  type="button"
                  className="primary-button full-width"
                  onClick={
                    openCheckout
                  }
                >
                  Proceed to Checkout
                </button>

              </aside>

            </div>
          )}

        </div>

      </section>

      {/* ======================================================
          PHASE 11 - ORDERS
      ====================================================== */}

      <section
        id="orders"
        className="section"
      >

        <div className="container">

          <div className="section-heading">

            <span className="section-label">
              Orders
            </span>

            <h2>
              My Orders
            </h2>

          </div>

          {ordersLoading && (
            <div className="loading-state">
              Loading orders...
            </div>
          )}

          {ordersError && (
            <div className="error-message">
              {ordersError}
            </div>
          )}

          {!ordersLoading &&
            !ordersError &&
            myOrders.length ===
            0 && (
              <div className="empty-state">
                You have no orders yet.
              </div>
            )}

          <div className="orders-list">

            {myOrders.map(
              (order) => (
                <div
                  className="order-card"
                  key={
                    order?._id
                  }
                >

                  <div className="order-header">

                    <div>

                      <strong>
                        Order #
                        {String(
                          order?._id ||
                          ""
                        ).slice(
                          -8
                        )}
                      </strong>

                      <p>
                        {order?.createdAt
                          ? new Date(
                            order.createdAt
                          ).toLocaleDateString()
                          : ""}
                      </p>

                    </div>

                    <span className="order-status">
                      {order?.status ||
                        "pending"}
                    </span>

                  </div>

                  <div className="order-items">

                    {(order?.items ||
                      []).map(
                        (
                          item,
                          index
                        ) => {

                          const product =
                            item?.product;

                          const name =
                            typeof product ===
                              "object"
                              ? getProductName(
                                product
                              )
                              : "Product";

                          return (
                            <div
                              className="order-item"
                              key={
                                item?._id ||
                                index
                              }
                            >

                              <span>
                                {name}
                              </span>

                              <span>
                                ×{" "}
                                {item?.quantity ||
                                  1}
                              </span>

                            </div>
                          );
                        }
                      )}

                  </div>

                  <div className="order-footer">

                    <strong>
                      Total:{" "}
                      {formatPrice(
                        order?.totalAmount
                      )}
                    </strong>

                    <span>
                      Payment:{" "}
                      {order?.paymentStatus ||
                        "pending"}
                    </span>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        setReturnOrder(
                          order
                        )
                      }
                    >
                      Return / Refund
                    </button>

                  </div>

                </div>
              )
            )}

          </div>

        </div>

      </section>

      {/* ======================================================
          PHASE 12 - NOTIFICATIONS
      ====================================================== */}

      <section
        id="notifications"
        className="section"
      >

        <div className="container">

          <div className="section-heading">

            <span className="section-label">
              Updates
            </span>

            <h2>
              Notifications
            </h2>

          </div>

          <NotificationPanel />

        </div>

      </section>

      {/* ======================================================
          PHASE 24 - LIVE CHAT
      ====================================================== */}

      <section
        id="live-chat"
        className="section live-chat-section"
      >
        <div className="container">
          <div className="section-heading">
            <span className="section-label">
              Support
            </span>
            <h2>Live Chat & Support</h2>
            <p>
              Chat with support, sellers or admins from ShopMart.
            </p>
          </div>

          <LiveChat refreshKey={chatRefreshKey} />
        </div>
      </section>

      {/* ======================================================
          GOOGLE LOGIN
      ====================================================== */}

      <section
        id="login"
        className="section login-section"
      >

        <div className="container">

          <div className="section-heading">

            <span className="section-label">
              Account
            </span>

            <h2>
              {accountUser ? `Welcome, ${accountUser.name || "ShopMart user"}` : "Continue with Google"}
            </h2>

            <p>
              {accountUser
                ? (accountUser.email || "You are signed in to ShopMart.")
                : "Login to manage orders, reviews and seller registration."}
            </p>

          </div>

          { !accountUser && (
            <div
              id="google-login-button"
              className="google-login-button"
            />
          )}

          {accountUser && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("authToken");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                setAccountUser(null);
                setGoogleMessage("You have been logged out.");
                setRefreshKey((value) => value + 1);
                setChatRefreshKey((value) => value + 1);
              }}
            >
              Logout
            </button>
          )}

          {googleLoading && (
            <p>
              Logging in...
            </p>
          )}

          {googleMessage && (
            <p className="success-text">
              {googleMessage}
            </p>
          )}

        </div>

      </section>

      {/* ======================================================
          CHECKOUT MODAL
      ====================================================== */}

      {checkoutOpen && (
        <div className="modal-overlay">

          <div className="checkout-modal">

            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setCheckoutOpen(
                  false
                )
              }
            >
              ×
            </button>

            <h2>
              Checkout
            </h2>

            <p>
              Complete your shipping
              information.
            </p>

            <div className="checkout-form">

              <input
                name="fullName"
                placeholder="Full Name"
                value={
                  shippingAddress.fullName
                }
                onChange={
                  handleShippingChange
                }
              />

              <div className="phone-row">

                <input
                  name="countryCode"
                  value={
                    shippingAddress.countryCode
                  }
                  onChange={
                    handleShippingChange
                  }
                />

                <input
                  name="phone"
                  placeholder="Phone Number"
                  value={
                    shippingAddress.phone
                  }
                  onChange={
                    handleShippingChange
                  }
                />

              </div>

              <input
                name="cnic"
                placeholder="CNIC"
                value={
                  shippingAddress.cnic
                }
                onChange={
                  handleShippingChange
                }
              />

              <textarea
                name="address"
                placeholder="Complete Address"
                value={
                  shippingAddress.address
                }
                onChange={
                  handleShippingChange
                }
              />

              <div className="checkout-grid">

                <input
                  name="city"
                  placeholder="City"
                  value={
                    shippingAddress.city
                  }
                  onChange={
                    handleShippingChange
                  }
                />

                <input
                  name="province"
                  placeholder="Province"
                  value={
                    shippingAddress.province
                  }
                  onChange={
                    handleShippingChange
                  }
                />

                <input
                  name="postalCode"
                  placeholder="Postal Code"
                  value={
                    shippingAddress.postalCode
                  }
                  onChange={
                    handleShippingChange
                  }
                />

              </div>

              {orderMessage && (
                <div
                  className={`status-message ${orderMessageType}`}
                >
                  {orderMessage}
                </div>
              )}

              <div className="checkout-summary">

                <span>
                  Order Total
                </span>

                <strong>
                  {formatPrice(
                    cartTotal
                  )}
                </strong>

              </div>

              {/* COD */}

              <button
                type="button"
                className="primary-button full-width"
                disabled={
                  orderLoading
                }
                onClick={
                  createCodOrder
                }
              >
                {orderLoading
                  ? "Placing Order..."
                  : "Place COD Order"}
              </button>

              {/* STRIPE */}

              <button
                type="button"
                className="secondary-button full-width"
                disabled={
                  paymentLoading
                }
                onClick={
                  startStripeCheckout
                }
              >
                {paymentLoading
                  ? "Opening Payment..."
                  : "Pay Online with Stripe"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          PHASE 13 - RETURN REQUEST
      ====================================================== */}

      {returnOrder && (
        <ReturnRequest
          order={
            returnOrder
          }
          onClose={() =>
            setReturnOrder(null)
          }
          onSubmitted={() => {
            setReturnOrder(null);

            setRefreshKey(
              (value) =>
                value + 1
            );
          }}
        />
      )}

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="footer">

        <div className="container">

          <div className="footer-content">

            <div>

              <h2>
                ShopMart
              </h2>

              <p>
                Your multi-vendor
                e-commerce marketplace.
              </p>

            </div>

            <div className="footer-links">

              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "home"
                  )
                }
              >
                Home
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "shop"
                  )
                }
              >
                Shop
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "orders"
                  )
                }
              >
                Orders
              </button>

              <button
                type="button"
                onClick={() =>
                  openWorkspace("seller", "registration")
                }
              >
                Sell on ShopMart
              </button>

            </div>

          </div>

          <div className="footer-bottom">

            ©{" "}
            {new Date().getFullYear()}{" "}
            ShopMart. All rights
            reserved.

          </div>

        </div>

      </footer>

    </div>
  );
}


