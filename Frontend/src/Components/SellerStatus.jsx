import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";


function SellerStatus({ token }) {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/sellers/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setSeller(data.seller);
      }
    } catch (error) {
      console.error(
        "Seller status error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadStatus();
    }
  }, [token]);

  if (loading) {
    return <p>Loading seller status...</p>;
  }

  if (!seller) {
    return null;
  }

  if (seller.sellerStatus === "none") {
    return null;
  }

  return (
    <section className="seller-status">
      <h2>Seller Application</h2>

      <p>
        <strong>Shop:</strong>{" "}
        {seller.shopName}
      </p>

      <p>
        <strong>Status:</strong>{" "}
        {seller.sellerStatus}
      </p>

      {seller.sellerStatus === "pending" && (
        <p>
          Your seller application is waiting
          for admin verification.
        </p>
      )}

      {seller.sellerStatus === "approved" && (
        <p>
          Your seller account has been approved.
          You can now access seller features.
        </p>
      )}

      {seller.sellerStatus === "rejected" && (
        <div>
          <p>
            Your seller application was rejected.
          </p>

          <p>
            <strong>Reason:</strong>{" "}
            {seller.sellerRejectionReason ||
              "No reason provided"}
          </p>
        </div>
      )}
    </section>
  );
}

export default SellerStatus;