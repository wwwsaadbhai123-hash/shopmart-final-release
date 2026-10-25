import { useState } from "react";
import { API_BASE_URL } from "../config";


function SellerRegistration({ token, onSubmitted }) {
  const [shopName, setShopName] = useState("");
  const [cnicNumber, setCnicNumber] = useState("");

  const [cnicFront, setCnicFront] = useState(null);
  const [cnicBack, setCnicBack] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCnicChange = (event) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 13);

    setCnicNumber(value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");

    if (!token) {
      setMessage("Please login first.");
      return;
    }

    if (!shopName.trim()) {
      setMessage("Please enter your shop name.");
      return;
    }

    if (cnicNumber.length !== 13) {
      setMessage("CNIC must contain 13 digits.");
      return;
    }

    if (!cnicFront || !cnicBack) {
      setMessage(
        "Please upload both CNIC front and back images."
      );
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append(
        "shopName",
        shopName.trim()
      );

      formData.append(
        "cnicNumber",
        cnicNumber
      );

      formData.append(
        "cnicFront",
        cnicFront
      );

      formData.append(
        "cnicBack",
        cnicBack
      );

      const response = await fetch(
        `${API_BASE_URL}/api/sellers/register`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Seller registration failed."
        );

        return;
      }

      setMessage(
        "Seller application submitted successfully. Waiting for admin approval."
      );

      setShopName("");
      setCnicNumber("");
      setCnicFront(null);
      setCnicBack(null);

      const frontInput =
        document.getElementById(
          "seller-cnic-front"
        );

      const backInput =
        document.getElementById(
          "seller-cnic-back"
        );

      if (frontInput) {
        frontInput.value = "";
      }

      if (backInput) {
        backInput.value = "";
      }

      if (onSubmitted) {
        onSubmitted(data);
      }
    } catch (error) {
      console.error(
        "Seller registration error:",
        error
      );

      setMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="seller-registration">
      <h2>Become a Seller</h2>

      <p>
        Submit your shop and CNIC details for admin
        verification.
      </p>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Shop Name</label>

          <input
            type="text"
            value={shopName}
            onChange={(event) =>
              setShopName(event.target.value)
            }
            placeholder="Enter your shop name"
          />
        </div>

        <div>
          <label>CNIC Number</label>

          <input
            type="text"
            value={cnicNumber}
            onChange={handleCnicChange}
            placeholder="1234512345671"
            maxLength={13}
          />

          <small>
            Enter 13 digits without dashes.
          </small>
        </div>

        <div>
          <label>CNIC Front Image</label>

          <input
            id="seller-cnic-front"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(event) =>
              setCnicFront(
                event.target.files?.[0] || null
              )
            }
          />
        </div>

        <div>
          <label>CNIC Back Image</label>

          <input
            id="seller-cnic-back"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(event) =>
              setCnicBack(
                event.target.files?.[0] || null
              )
            }
          />
        </div>

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Submitting..."
            : "Submit Seller Application"}
        </button>

        {message && (
          <p>{message}</p>
        )}
      </form>
    </section>
  );
}

export default SellerRegistration;