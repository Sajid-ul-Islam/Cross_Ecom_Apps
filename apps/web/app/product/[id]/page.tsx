"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchProduct, fetchProducts, fetchDeliveryFees, bdt, type Product, type DeliveryFees } from "@/lib/api";
import { useCart } from "@/lib/cart";
import SizeGuideModal from "@/components/SizeGuideModal";
import DenimCareGuideModal from "@/components/DenimCareGuideModal";
import StoreStockModal from "@/components/StoreStockModal";
import WhatsAppButton from "@/components/WhatsAppButton";
import ProductCard from "@/components/ProductCard";

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("fabric");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFees>({ insideDhaka: 50, outsideDhaka: 90, express: 120, storePickup: 0 });

  // Modals
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [careGuideOpen, setCareGuideOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);

  const { addItem } = useCart();

  useEffect(() => {
    fetchProduct(id).then((p) => {
      setProduct(p);
      if (p?.sizes?.[0]) setSelectedSize(p.sizes[0]);
      setLoading(false);

      if (p?.category) {
        fetchProducts({ category: p.category, per_page: 4 }).then((res) => {
          setRelated(res.filter((item: Product) => String(item.id) !== String(id)).slice(0, 4));
        });
      }
    });
    // Fetch delivery fees from API (single source of truth)
    fetchDeliveryFees().then((fees) => {
      setDeliveryFees(fees);
    });
  }, [id]);

  const handleAdd = () => {
    if (!product || !selectedSize) return;
    for (let i = 0; i < qty; i++) addItem(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product || !selectedSize) return;
    for (let i = 0; i < qty; i++) addItem(product, selectedSize);
    router.push(`/checkout?productId=${product.id}&size=${encodeURIComponent(selectedSize)}&qty=${qty}`);
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
    <div className="container" style={{ paddingBottom: 80 }}>
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
          gridTemplateColumns: "1.1fr 1fr",
          gap: 48,
          alignItems: "start",
        }}
        className="product-detail-grid"
      >
        {/* Gallery */}
        <div>
          {/* Main Image */}
          <div
            onClick={() => setLightboxOpen(true)}
            style={{
              borderRadius: "var(--radius)",
              overflow: "hidden",
              background: "var(--surface-2)",
              aspectRatio: "3/4",
              marginBottom: 12,
              cursor: "zoom-in",
              position: "relative",
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
                👖
              </div>
            )}
            <span
              style={{
                position: "absolute",
                bottom: 12,
                right: 12,
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 8px",
                borderRadius: 4,
              }}
            >
              🔍 Pinch / Click to Zoom
            </span>
          </div>

          {/* Thumbnails */}
          {gallery.length > 1 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {gallery.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  style={{
                    width: 76,
                    height: 96,
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

        {/* Info & Buying Controls */}
        <div>
          {/* Category & Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: "var(--sub)", textTransform: "uppercase" }}>
              {product.category}
            </span>
            {product.isNew && (
              <span style={{ background: "var(--indigo)", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 800 }}>
                NEW DROP
              </span>
            )}
            {product.fabric && (
              <span style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--ink)", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                {product.fabric}
              </span>
            )}
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--ink)", lineHeight: 1.25, marginBottom: 12 }}>
            {product.name}
          </h1>

          {/* Rating */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} style={{ color: s <= Math.round(product.rating || 5) ? "#f59e0b" : "var(--border)", fontSize: 16 }}>
                  ★
                </span>
              ))}
            </div>
            <span style={{ fontSize: 13, color: "var(--sub)", fontWeight: 600 }}>
              {(product.rating || 4.9).toFixed(1)} ({product.ratingCount || 18} Verified Buyer Reviews)
            </span>
          </div>

          {/* Price */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: "var(--indigo)" }}>
              {bdt(price)}
            </span>
            {product.regularPrice && product.regularPrice > price && (
              <>
                <span style={{ fontSize: 18, color: "var(--faint)", textDecoration: "line-through" }}>
                  {bdt(product.regularPrice)}
                </span>
                <span style={{ background: "var(--crimson)", color: "#fff", fontSize: 12, fontWeight: 800, padding: "3px 8px", borderRadius: 4 }}>
                  SAVE {bdt(product.regularPrice - price)}
                </span>
              </>
            )}
          </div>

          {/* Blurb */}
          {product.blurb && (
            <p style={{ fontSize: 14, color: "var(--sub)", lineHeight: 1.7, marginBottom: 20 }}>
              {product.blurb}
            </p>
          )}

          {/* Size Selector Header with Size Guide CTA */}
          {product.sizes && product.sizes.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Select Size: <strong>{selectedSize}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--indigo)",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  📐 Size Guide
                </button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    style={{
                      minWidth: 48,
                      padding: "10px 18px",
                      borderRadius: 8,
                      border: `2px solid ${selectedSize === s ? "var(--indigo)" : "var(--border)"}`,
                      background: selectedSize === s ? "var(--indigo)" : "var(--surface)",
                      color: selectedSize === s ? "#fff" : "var(--ink)",
                      fontSize: 14,
                      fontWeight: 800,
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

          {/* Quantity Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink)", textTransform: "uppercase" }}>
              Quantity:
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface-2)", padding: 4, borderRadius: 8, border: "1px solid var(--border)" }}>
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQty(Math.max(1, qty - 1))}
                style={{ width: 32, height: 32, borderRadius: 6 }}
              >
                −
              </button>
              <span style={{ minWidth: 28, textAlign: "center", fontWeight: 800, fontSize: 14 }}>{qty}</span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQty(Math.min(10, qty + 1))}
                style={{ width: 32, height: 32, borderRadius: 6 }}
              >
                +
              </button>
            </div>
          </div>

          {/* Main Action Buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <button
              type="button"
              className="btn btn--primary"
              style={{ flex: 1.2, padding: "14px 20px", fontSize: 14, fontWeight: 900 }}
              onClick={handleAdd}
              disabled={product.stockStatus === "outofstock"}
            >
              {product.stockStatus === "outofstock"
                ? "Out of Stock"
                : added
                ? "✓ Added to Bag!"
                : "🛍 ADD TO BAG"}
            </button>
            <button
              type="button"
              className="btn btn--outline"
              style={{ flex: 1, padding: "14px 20px", fontSize: 14, fontWeight: 900, textAlign: "center", cursor: "pointer", background: "var(--surface-2)" }}
              onClick={handleBuyNow}
              disabled={product.stockStatus === "outofstock"}
            >
              ⚡ এখনই কিনুন (BUY NOW)
            </button>
          </div>

          {/* Quick Interactive Aux Actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
            <button
              type="button"
              onClick={() => setStockModalOpen(true)}
              className="btn btn--outline"
              style={{ flex: 1, fontSize: 12, padding: "8px 12px", fontWeight: 700 }}
            >
              🏪 Check Outlet Stock
            </button>
            <button
              type="button"
              onClick={() => setCareGuideOpen(true)}
              className="btn btn--outline"
              style={{ flex: 1, fontSize: 12, padding: "8px 12px", fontWeight: 700 }}
            >
              📖 Denim Care Guide
            </button>
            <WhatsAppButton
              productName={product.name}
              size={selectedSize}
              sku={product.sku}
              style={{ flex: 1, fontSize: 12, padding: "8px 12px" }}
            />
          </div>

          {/* Specs Accordions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
            {/* 1. Fabric */}
            <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--surface)" }}>
              <button
                type="button"
                onClick={() => setActiveAccordion(activeAccordion === "fabric" ? null : "fabric")}
                style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: 800, fontSize: 13, color: "var(--ink)" }}
              >
                <span>🧵 FABRIC & CONSTRUCTION</span>
                <span>{activeAccordion === "fabric" ? "−" : "+"}</span>
              </button>
              {activeAccordion === "fabric" && (
                <div style={{ padding: "0 16px 14px", fontSize: 13, color: "var(--sub)", lineHeight: 1.6 }}>
                  Crafted from 13.5 oz artisanal raw selvedge denim woven on vintage shuttle looms. Features genuine redline selvedge ID, antique brass donut buttons, and copper rivets.
                </div>
              )}
            </div>

            {/* 2. Shipping */}
            <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--surface)" }}>
              <button
                type="button"
                onClick={() => setActiveAccordion(activeAccordion === "shipping" ? null : "shipping")}
                style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: 800, fontSize: 13, color: "var(--ink)" }}
              >
                <span>🚚 LOGISTICS & DOORSTEP EXCHANGE</span>
                <span>{activeAccordion === "shipping" ? "−" : "+"}</span>
              </button>
              {activeAccordion === "shipping" && (
                <div style={{ padding: "0 16px 14px", fontSize: 13, color: "var(--sub)", lineHeight: 1.6 }}>
                  • <strong>Dhaka Metro:</strong> {bdt(deliveryFees.insideDhaka)} delivery fee (24–48h Pathao Express).<br />
                  • <strong>Outside Dhaka:</strong> {bdt(deliveryFees.outsideDhaka)} delivery charge across all 64 districts.<br />
                  • <strong>7-Day Doorstep Guarantee:</strong> Size swap delivered directly to your doorstep.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Complete The Look / Related Products */}
      {related.length > 0 && (
        <div style={{ marginTop: 60, borderTop: "1px solid var(--border)", paddingTop: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)" }}>COMPLETE THE LOOK</h2>
              <p style={{ fontSize: 13, color: "var(--sub)" }}>Pair this garment with our signature artisanal drops</p>
            </div>
            <Link href="/shop" className="btn btn--outline" style={{ fontSize: 12, fontWeight: 800 }}>
              View All →
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && gallery[selectedImage] && (
        <div className="modal-overlay" onClick={() => setLightboxOpen(false)} style={{ zIndex: 9999 }}>
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gallery[selectedImage]}
              alt={product.name}
              style={{ maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }}
            />
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "rgba(0,0,0,0.7)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Popups & Dialogs */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        category={product.category}
        selectedSize={selectedSize}
        onSelectSize={(s) => {
          setSelectedSize(s);
          setSizeGuideOpen(false);
        }}
      />

      <DenimCareGuideModal
        isOpen={careGuideOpen}
        onClose={() => setCareGuideOpen(false)}
      />

      <StoreStockModal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        product={product}
        selectedSize={selectedSize}
      />

      <style>{`
        @media (max-width: 768px) {
          .product-detail-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </div>
  );
}
