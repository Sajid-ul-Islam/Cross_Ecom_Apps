"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchProduct, bdt, type Product } from "@/lib/api";
import { useCart } from "@/lib/cart";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    fetchProduct(id).then((p) => {
      setProduct(p);
      if (p?.sizes?.[0]) setSelectedSize(p.sizes[0]);
      setLoading(false);
    });
  }, [id]);

  const handleAdd = () => {
    if (!product || !selectedSize) return;
    for (let i = 0; i < qty; i++) addItem(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: "center", padding: "120px 0" }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-state__icon">😕</div>
          <h2 className="empty-state__title">Product not found</h2>
          <Link href="/shop" className="btn btn-primary">Back to Shop</Link>
        </div>
      </div>
    );
  }

  const price = product.salePrice ?? product.price;
  const gallery = product.gallery?.length ? product.gallery : [product.images[0], product.images[1]].filter(Boolean);

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/shop">Shop</Link>
        <span>/</span>
        <Link href={`/shop?category=${product.category}`}>{product.category}</Link>
        <span>/</span>
        <span style={{ color: "var(--ink)", fontWeight: 600 }}>{product.name}</span>
      </nav>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 48,
          alignItems: "start",
        }}
        className="product-detail-grid"
      >
        {/* Images */}
        <div>
          {/* Main image */}
          <div
            style={{
              borderRadius: "var(--radius)",
              overflow: "hidden",
              background: "var(--surface-2)",
              aspectRatio: "3/4",
              marginBottom: 12,
            }}
          >
            {gallery[selectedImage] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gallery[selectedImage]}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 64 }}>
                👕
              </div>
            )}
          </div>
          {/* Thumbnails */}
          {gallery.length > 1 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  style={{
                    width: 72,
                    height: 90,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: `2px solid ${i === selectedImage ? "var(--indigo)" : "var(--border)"}`,
                    padding: 0,
                    cursor: "pointer",
                    background: "var(--surface-2)",
                    flexShrink: 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {/* Category */}
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: "var(--sub)", textTransform: "uppercase", marginBottom: 8 }}>
            {product.category}
            {product.isNew && (
              <span style={{ marginLeft: 8, background: "var(--indigo)", color: "#fff", padding: "2px 8px", borderRadius: 4 }}>
                NEW
              </span>
            )}
          </p>

          <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--ink)", lineHeight: 1.25, marginBottom: 16 }}>
            {product.name}
          </h1>

          {/* Rating */}
          {product.rating > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} style={{ color: s <= Math.round(product.rating) ? "#f59e0b" : "var(--border)", fontSize: 16 }}>
                    ★
                  </span>
                ))}
              </div>
              <span style={{ fontSize: 13, color: "var(--sub)" }}>
                {product.rating.toFixed(1)} ({product.ratingCount} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 30, fontWeight: 900, color: "var(--indigo)" }}>
              {bdt(price)}
            </span>
            {product.regularPrice && product.regularPrice > price && (
              <>
                <span style={{ fontSize: 18, color: "var(--faint)", textDecoration: "line-through" }}>
                  {bdt(product.regularPrice)}
                </span>
                {product.salePct && (
                  <span style={{ background: "var(--crimson)", color: "#fff", fontSize: 12, fontWeight: 800, padding: "2px 8px", borderRadius: 4 }}>
                    -{product.salePct}%
                  </span>
                )}
              </>
            )}
          </div>

          {/* Blurb */}
          {product.blurb && (
            <p style={{ fontSize: 14, color: "var(--sub)", lineHeight: 1.7, marginBottom: 20 }}>
              {product.blurb}
            </p>
          )}

          {/* Fabric */}
          {product.fabric && (
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "var(--surface-2)", border: "1px solid var(--border)",
                borderRadius: 6, padding: "4px 10px", marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 12, color: "var(--sub)" }}>Material:</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{product.fabric}</span>
            </div>
          )}

          {/* Size selector */}
          {product.sizes.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                Size
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: `2px solid ${selectedSize === s ? "var(--indigo)" : "var(--border)"}`,
                      background: selectedSize === s ? "var(--indigo)" : "var(--surface)",
                      color: selectedSize === s ? "#fff" : "var(--ink)",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Qty
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="qty-display">{qty}</span>
              <button className="qty-btn" onClick={() => setQty(Math.min(10, qty + 1))}>+</button>
            </div>
          </div>

          {/* Add to cart */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
            <button
              className="btn btn-primary btn-lg"
              style={{ flex: 1 }}
              onClick={handleAdd}
              disabled={product.stockStatus === "outofstock"}
            >
              {product.stockStatus === "outofstock"
                ? "Out of Stock"
                : added
                ? "✓ Added to Cart!"
                : "🛍 Add to Cart"}
            </button>
            <Link href="/checkout" className="btn btn-outline btn-lg" style={{ flex: 1, textAlign: "center" }}>
              Buy Now
            </Link>
          </div>

          {/* Trust micro-badges */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "🚚 Dhaka delivery ৳80 (24–48h) · Outside Dhaka ৳150 (3–5 days)",
              "🔄 7-day easy returns",
              "✅ Authentic DEEN quality guaranteed",
            ].map((t) => (
              <p key={t} style={{ fontSize: 12, color: "var(--sub)" }}>{t}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 768px) {
          .product-detail-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </div>
  );
}
