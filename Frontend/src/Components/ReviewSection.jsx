import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";


function ReviewSection({ productId, token, onReviewChange }) {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editingReview, setEditingReview] = useState(null);
  const [message, setMessage] = useState("");

  // =====================================================
  // LOAD REVIEWS
  // =====================================================

  const loadReviews = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/reviews/product/${productId}`
      );

      const data = await response.json();

      if (data.success) {
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 0);
        setTotalReviews(data.totalReviews || 0);
      }
    } catch (error) {
      console.error("Load reviews error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadReviews();
    }
  }, [productId]);

  // =====================================================
  // SUBMIT REVIEW
  // =====================================================

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (!token) {
      setMessage("Please login to write a review.");
      return;
    }

    if (!comment.trim()) {
      setMessage("Please write a review.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const url = editingReview
        ? `${API_BASE_URL}/api/reviews/${editingReview._id}`
        : `${API_BASE_URL}/api/reviews/product/${productId}`;

      const method = editingReview ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to save review.");
        return;
      }

      setMessage(
        editingReview
          ? "Review updated successfully."
          : "Review added successfully."
      );

      setComment("");
      setRating(5);
      setEditingReview(null);

      await loadReviews();

      if (onReviewChange) {
        onReviewChange();
      }
    } catch (error) {
      console.error("Submit review error:", error);

      setMessage("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // EDIT REVIEW
  // =====================================================

  const handleEdit = (review) => {
    setEditingReview(review);
    setRating(review.rating);
    setComment(review.comment);

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  // =====================================================
  // DELETE REVIEW
  // =====================================================

  const handleDelete = async (reviewId) => {
    if (!token) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/reviews/${reviewId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to delete review.");
        return;
      }

      setMessage("Review deleted successfully.");

      await loadReviews();

      if (onReviewChange) {
        onReviewChange();
      }
    } catch (error) {
      console.error("Delete review error:", error);

      setMessage("Something went wrong.");
    }
  };

  // =====================================================
  // CHECK CURRENT USER
  // =====================================================

  let currentUserId = null;

  try {
    const storedUser =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("currentUser"));

    currentUserId = storedUser?._id || storedUser?.id || null;
  } catch (error) {
    currentUserId = null;
  }

  return (
    <section className="review-section">
      <div className="review-header">
        <div>
          <h2>Customer Reviews</h2>

          <div className="review-summary">
            <strong>{averageRating.toFixed(1)}</strong>

            <span className="review-stars">
              {"★".repeat(Math.round(averageRating))}
              {"☆".repeat(5 - Math.round(averageRating))}
            </span>

            <span>
              {totalReviews}{" "}
              {totalReviews === 1 ? "Review" : "Reviews"}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================= */}
      {/* REVIEW FORM */}
      {/* ============================================= */}

      {token ? (
        <form className="review-form" onSubmit={handleSubmitReview}>
          <h3>
            {editingReview ? "Edit Your Review" : "Write a Review"}
          </h3>

          <div className="rating-selector">
            <label>Your Rating</label>

            <div className="rating-buttons">
              {[1, 2, 3, 4, 5].map((number) => (
                <button
                  type="button"
                  key={number}
                  className={
                    number <= rating ? "active-star" : ""
                  }
                  onClick={() => setRating(number)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Write your review..."
            rows="5"
            maxLength="1000"
          />

          <div className="review-form-actions">
            <button
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : editingReview
                ? "Update Review"
                : "Submit Review"}
            </button>

            {editingReview && (
              <button
                type="button"
                onClick={() => {
                  setEditingReview(null);
                  setRating(5);
                  setComment("");
                  setMessage("");
                }}
              >
                Cancel
              </button>
            )}
          </div>

          {message && (
            <p className="review-message">
              {message}
            </p>
          )}
        </form>
      ) : (
        <div className="review-login-message">
          Please login to write a review.
        </div>
      )}

      {/* ============================================= */}
      {/* REVIEWS LIST */}
      {/* ============================================= */}

      <div className="reviews-list">
        {loading ? (
          <p>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p>No reviews yet. Be the first to review this product.</p>
        ) : (
          reviews.map((review) => {
            const reviewUserId =
              review.user?._id || review.user?.id;

            const isOwner =
              currentUserId &&
              reviewUserId &&
              currentUserId.toString() ===
                reviewUserId.toString();

            return (
              <article
                className="review-card"
                key={review._id}
              >
                <div className="review-card-header">
                  <div>
                    <strong>
                      {review.user?.name || "Customer"}
                    </strong>

                    <div className="review-card-rating">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </div>
                  </div>

                  <small>
                    {review.createdAt
                      ? new Date(
                          review.createdAt
                        ).toLocaleDateString()
                      : ""}
                  </small>
                </div>

                <p>{review.comment}</p>

                {isOwner && (
                  <div className="review-actions">
                    <button
                      type="button"
                      onClick={() => handleEdit(review)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(review._id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export default ReviewSection;