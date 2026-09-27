"use client";

import React, { useState, useEffect } from "react";
import {
  fetchProductComments,
  submitProductComment,
  type ProductComment,
} from "@/lib/api";

interface ProductCommentsProps {
  productId: string | number;
  productName: string;
}

export default function ProductComments({ productId, productName }: ProductCommentsProps) {
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(5.0);
  const [totalCount, setTotalCount] = useState(0);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetchProductComments(productId);
        if (active) {
          setComments(res.comments || []);
          setTotalCount(res.count || 0);
          setAverageRating(res.averageRating || 5.0);
        }
      } catch {
        // graceful fallback
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim()) {
      setStatusMessage({ type: "error", text: "Please provide your name." });
      return;
    }
    if (!content.trim()) {
      setStatusMessage({ type: "error", text: "Please enter your review or feedback." });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await submitProductComment(productId, {
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim(),
        content: content.trim(),
        rating,
      });

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: res.message || "Thank you! Your review has been saved in WordPress.",
        });
        // Optimistically prepend to comments
        setComments((prev) => [res.comment, ...prev.filter((c) => c.id !== res.comment.id)]);
        setTotalCount((prev) => prev + 1);
        setContent("");
        setShowForm(false);
      } else {
        setStatusMessage({ type: "error", text: res.message || "Failed to submit comment." });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Network error. Could not connect to WordPress to post comment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Compute rating breakdown
  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  comments.forEach((c) => {
    const r = Math.min(5, Math.max(1, Math.round(c.rating || 5)));
    ratingCounts[r] = (ratingCounts[r] || 0) + 1;
  });

  return (
    <section
      id="customer-reviews"
      style={{
        marginTop: 48,
        paddingTop: 36,
        borderTop: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              CUSTOMER REVIEWS & COMMENTS
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: 12,
                background: "var(--surface-2)",
                color: "var(--sub)",
              }}
            >
              WORDPRESS VERIFIED
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--sub)" }}>
            Real customer fit impressions and reviews for {productName}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            setStatusMessage(null);
          }}
          className="btn btn--primary"
          style={{
            fontSize: 13,
            fontWeight: 800,
            padding: "10px 20px",
            borderRadius: "var(--radius)",
          }}
        >
          {showForm ? "✕ Cancel" : "✍ Write a Review"}
        </button>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius)",
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 600,
            background: statusMessage.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
            color: statusMessage.type === "success" ? "#065f46" : "#991b1b",
            border: `1px solid ${statusMessage.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
          }}
        >
          {statusMessage.type === "success" ? "✓ " : "⚠ "}
          {statusMessage.text}
        </div>
      )}

      {/* Review Submission Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: 24,
            marginBottom: 32,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 16 }}>
            Share Your Experience
          </h3>

          {/* Star Rating Picker */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--sub)", marginBottom: 6, textTransform: "uppercase" }}>
              Your Overall Rating
            </label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (hoverRating || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Rate ${star} star`}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 2,
                      fontSize: 24,
                      color: filled ? "#f59e0b" : "var(--border)",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    ★
                  </button>
                );
              })}
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginLeft: 8 }}>
                {hoverRating || rating} / 5 Stars
              </span>
            </div>
          </div>

          {/* Input Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--sub)", marginBottom: 6, textTransform: "uppercase" }}>
                Your Name <span style={{ color: "var(--crimson)" }}>*</span>
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Tanvir Ahmed"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--ink)",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--sub)", marginBottom: 6, textTransform: "uppercase" }}>
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder="e.g. tanvir@gmail.com"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--ink)",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Review Textarea */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--sub)", marginBottom: 6, textTransform: "uppercase" }}>
              Your Review / Fit Comment <span style={{ color: "var(--crimson)" }}>*</span>
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="How does it fit? What do you think about the denim weight, fabric feel, or tailoring?"
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--ink)",
                fontSize: 14,
                lineHeight: 1.6,
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn--outline"
              style={{ fontSize: 13, padding: "8px 16px" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn--primary"
              style={{ fontSize: 13, padding: "8px 22px", fontWeight: 800 }}
            >
              {submitting ? "Saving to WordPress..." : "Post Review to WordPress"}
            </button>
          </div>
        </form>
      )}

      {/* Ratings Overview Card */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: 28,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: 24,
          marginBottom: 32,
        }}
        className="rating-overview-grid"
      >
        {/* Left: Big Score */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", borderRight: "1px solid var(--border)", paddingRight: 20 }}>
          <div style={{ fontSize: 44, fontWeight: 900, color: "var(--ink)", lineHeight: 1 }}>
            {averageRating.toFixed(1)}
          </div>
          <div style={{ color: "#f59e0b", fontSize: 18, margin: "6px 0" }}>
            {"★".repeat(Math.round(averageRating))}
            {"☆".repeat(5 - Math.round(averageRating))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)" }}>
            Based on {totalCount} {totalCount === 1 ? "review" : "reviews"}
          </div>
        </div>

        {/* Right: Breakdown bars */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          {[5, 4, 3, 2, 1].map((s) => {
            const count = ratingCounts[s] || 0;
            const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}>
                <span style={{ width: 40, fontWeight: 700, color: "var(--ink)" }}>{s} ★</span>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    background: "var(--surface-2)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: "#f59e0b",
                      borderRadius: 4,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <span style={{ width: 30, color: "var(--sub)", textAlign: "right" }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--sub)", fontSize: 14 }}>
          Loading customer reviews from WordPress...
        </div>
      ) : comments.length === 0 ? (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            background: "var(--surface)",
            border: "1px dashed var(--border)",
            borderRadius: "var(--radius)",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
          <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>
            No comments yet
          </h4>
          <p style={{ fontSize: 13, color: "var(--sub)", maxWidth: 420, margin: "0 auto 18px" }}>
            Be the first to share your thoughts on the fit, fabric feel, and craftsmanship of {productName}.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn btn--primary"
            style={{ fontSize: 13, fontWeight: 800 }}
          >
            Leave the First Review
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {comments.map((rev) => {
            const formattedDate = (() => {
              try {
                const d = new Date(rev.date);
                if (isNaN(d.getTime())) return rev.date;
                return d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              } catch {
                return rev.date;
              }
            })();

            return (
              <div
                key={rev.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: 20,
                  boxShadow: "var(--shadow-xs)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: "var(--ink)" }}>
                        {rev.authorName}
                      </span>
                      {rev.status === "pending" ? (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "rgba(245, 158, 11, 0.15)",
                            color: "#b45309",
                          }}
                        >
                          Awaiting WordPress Moderation
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "rgba(16, 185, 129, 0.12)",
                            color: "#065f46",
                          }}
                        >
                          ✓ Verified Buyer
                        </span>
                      )}
                    </div>
                    <div style={{ color: "#f59e0b", fontSize: 14, marginTop: 4 }}>
                      {"★".repeat(Math.round(rev.rating || 5))}
                      {"☆".repeat(5 - Math.round(rev.rating || 5))}
                    </div>
                  </div>

                  <span style={{ fontSize: 12, color: "var(--sub)" }}>
                    {formattedDate}
                  </span>
                </div>

                <p style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.6, margin: 0 }}>
                  {rev.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
