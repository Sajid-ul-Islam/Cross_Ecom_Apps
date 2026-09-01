"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchProducts, bdt, resolveProductImage, type Product, type Category, CATEGORIES } from "@/lib/api";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState<Category>("ALL");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const products = await fetchProducts({
          category: selectedCat,
          search: query.trim(),
          sort: "default",
        });
        setResults(products.slice(0, 10));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, selectedCat, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      router.push(`/shop?search=${encodeURIComponent(query.trim())}${selectedCat !== "ALL" ? `&category=${selectedCat}` : ""}`);
    }
  };

  const handleSelectProduct = (productId: string) => {
    onClose();
    router.push(`/product/${productId}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        style={{ maxWidth: 640, width: "95vw", maxHeight: "88vh", overflowY: "auto", padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sub)" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by product, denim, shirt, panjabi..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--ink)",
              }}
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--sub)",
                  fontSize: 14,
                  cursor: "pointer",
                  padding: 6,
                }}
              >
                ✕
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--ink)",
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </form>

          {/* Quick Category Filter Chips */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingTop: 12, paddingBottom: 2 }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 14,
                  border: selectedCat === cat ? "1px solid var(--indigo)" : "1px solid var(--border)",
                  background: selectedCat === cat ? "var(--indigo)" : "var(--surface-2)",
                  color: selectedCat === cat ? "#fff" : "var(--sub)",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {cat === "ALL" ? "All Items" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Container */}
        <div style={{ padding: "12px 18px 18px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "var(--sub)", fontSize: 13 }}>
              Searching DEEN catalog…
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 4 }}>
                {query ? `No results for "${query}"` : "Search anything in store"}
              </p>
              <p style={{ fontSize: 12, color: "var(--sub)" }}>
                Try searching for &quot;Selvedge Jeans&quot;, &quot;Panjabi&quot;, or &quot;Shirt&quot;
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--sub)", textTransform: "uppercase" }}>
                  {results.length} Products Found
                </span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--indigo)",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  View All in Shop →
                </button>
              </div>

              {results.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSelectProduct(product.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 8,
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveProductImage(product.images?.[0], "/icon.png")}
                    alt={product.name}
                    style={{
                      width: 50,
                      height: 50,
                      objectFit: "cover",
                      borderRadius: 6,
                      background: "var(--surface-2)",
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong
                      style={{
                        fontSize: 13,
                        color: "var(--ink)",
                        display: "block",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {product.name}
                    </strong>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: "var(--sub)", background: "var(--surface-2)", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                        {product.category}
                      </span>
                      {product.sku && (
                        <span style={{ fontSize: 10, color: "var(--sub)" }}>
                          SKU: {product.sku}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <strong style={{ fontSize: 13, color: "var(--indigo)" }}>
                      {bdt(product.salePrice || product.price)}
                    </strong>
                    {product.salePrice && product.salePrice < product.price && (
                      <span style={{ display: "block", fontSize: 10, color: "var(--sub)", textDecoration: "line-through" }}>
                        {bdt(product.price)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
