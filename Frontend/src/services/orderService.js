import { API_BASE_URL } from "../config";
import { handleAuthResponse } from "../utils/authSession";

const API_URL = `${API_BASE_URL}/api/orders`;

// =========================================================
// GET AUTH TOKEN
// =========================================================
const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
};

// =========================================================
// CREATE ORDER
// =========================================================
export const createOrder = async (orderData) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    handleAuthResponse(response);
  }

  return response.json();
};

// =========================================================
// GET MY ORDERS
// =========================================================
export const getMyOrders = async () => {
  const response = await fetch(`${API_URL}/my-orders`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    handleAuthResponse(response);
  }

  return response.json();
};

// =========================================================
// GET SINGLE ORDER
// =========================================================
export const getOrderById = async (orderId) => {
  const response = await fetch(`${API_URL}/${orderId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    handleAuthResponse(response);
  }

  return response.json();
};

// =========================================================
// CANCEL ORDER
// =========================================================
export const cancelOrder = async (orderId) => {
  const response = await fetch(`${API_URL}/${orderId}/cancel`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    handleAuthResponse(response);
  }

  return response.json();
};

export default {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};
