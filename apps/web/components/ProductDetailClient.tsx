"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { bdt, resolveProductImage, type Product, type DeliveryFees } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import SizeGuideModal from "@/components/SizeGuideModal";
import DenimCareGuideModal from "@/components/DenimCareGuideModal";
import StoreStockModal from "@/components/StoreStockModal";
import BankOffersModal from "@/components/BankOffersModal";
import WhatsAppButton from "@/components/WhatsAppButton";
import ProductCard from "@/components/ProductCard";

interface ProductDetailClientProps {
  product: Product;
  related: Product[];
  deliveryFees: DeliveryFees;
}

export default function ProductDetailClient({
  product,
  related,
  deliveryFees,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || "");
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("fabric");
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Modals
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [careGuideOpen, setCareGuideOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [bankOffersOpen, setBankOffersOpen] = useState(false);

  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const price = product.salePrice ?? product.price;
  const rawGallery = product.gallery?.length ? product.gallery : [product.images[0], product.images[1]].filter(Boolean);
  const gallery = rawGallery.map((src) => resolveProductImage(src));

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
              <Image
                src={gallery[selectedImage]}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
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
                zIndex: 2,
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
                    position: "relative",
                  }}
                >
                  <Image src={img} alt="" fill sizes="76px" style={{ objectFit: "cover" }} />
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
            <p style={{ fontSize: 14, color: "var(--sub)", lineHeight: 1.7, marginBottom: 16 }}>
              {product.blurb}
            </p>
          )}

          {/* Bank & Card Discounts Trigger Banner */}
          <div
            onClick={() => setBankOffersOpen(true)}
            style={{
              background: "rgba(99,102,241,0.06)",
              border: "1px dashed var(--indigo)",
              borderRadius: "var(--radius)",
              padding: "10px 14px",
              marginBottom: 20,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              transition: "background 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>💳</span>
              <div>
                <strong style={{ fontSize: 12, color: "var(--ink)", display: "block" }}>
                  Bank &amp; Card Offers Available
                </strong>
                <span style={{ fontSize: 11, color: "var(--sub)" }}>
                  10%–15% instant savings with City Amex, BRAC Bank &amp; EBL
                </span>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--indigo)", whiteSpace: "nowrap" }}>
              View Offers →
            </span>
          </div>

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
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20, alignItems: "stretch" }}>
            <button
              type="button"
              className="btn btn--primary"
              style={{ flex: 1.2, padding: "14px 18px", fontSize: 14, fontWeight: 900 }}
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
              style={{ flex: 1, padding: "14px 18px", fontSize: 14, fontWeight: 900, textAlign: "center", cursor: "pointer", background: "var(--surface-2)" }}
              onClick={handleBuyNow}
              disabled={product.stockStatus === "outofstock"}
            >
              ⚡ এখনই কিনুন (BUY NOW)
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
              title={isInWishlist(product.id) ? "Remove from Wishlist" : "Save to Wishlist"}
              style={{
                width: 50,
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: isInWishlist(product.id) ? "rgba(225, 41, 62, 0.1)" : "var(--surface-2)",
                color: isInWishlist(product.id) ? "var(--crimson)" : "var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.2s ease",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={isInWishlist(product.id) ? "var(--crimson)" : "none"}
                stroke={isInWishlist(product.id) ? "var(--crimson)" : "currentColor"}
                strokeWidth="2.2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
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
              {(() => {
                const cat = (product.category || "").toUpperCase();
                if (cat.includes("JEAN") || cat.includes("DENIM")) return "📖 Denim Care Guide";
                if (cat.includes("PANJABI") || cat.includes("PUNJABI")) return "📖 Panjabi Care Guide";
                if (cat.includes("SHIRT") && !cat.includes("T-SHIRT")) return "📖 Shirt Care Guide";
                if (cat.includes("T-SHIRT") || cat.includes("TEE") || cat.includes("TANK")) return "📖 T-Shirt Care Guide";
                if (cat.includes("POLO")) return "📖 Polo Care Guide";
                if (cat.includes("TROUSER") || cat.includes("PANT") || cat.includes("CHINO")) return "📖 Trousers Care Guide";
                return "📖 Garment Care Guide";
              })()}
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
                  {(() => {
                    if (product.fabric && product.fabric.trim().length > 10) return product.fabric;
                    const cat = (product.category || "").toUpperCase();
                    if (cat.includes("JEAN") || cat.includes("DENIM")) {
                      return "Crafted from 13.5 oz artisanal raw selvedge denim woven on vintage shuttle looms. Features genuine redline selvedge ID, antique brass donut buttons, and copper rivets.";
                    }
                    if (cat.includes("PANJABI") || cat.includes("PUNJABI")) {
                      return "Crafted from 100% Egyptian Giza combed cotton & dobby jacquard weaves. Features high-density artisanal embroidery, tailored band collar, and natural coconut buttons.";
                    }
                    if (cat.includes("SHIRT") && !cat.includes("T-SHIRT")) {
                      return "Tailored from breathable high-count cotton poplin and linen blends. Engineered with reinforced side gussets, contoured camp collar, and mother-of-pearl buttons.";
                    }
                    if (cat.includes("T-SHIRT") || cat.includes("TEE") || cat.includes("TANK")) {
                      return "Cut from 220–240 GSM heavyweight pre-shrunk compact combed cotton. Zero-torque knit prevents seam twisting; double-needle bound ribbed neck retains shape.";
                    }
                    if (cat.includes("POLO")) {
                      return "Knitted from premium combed compact cotton honeycomb piqué. Features anti-curl tipped flat-knit collar, micro-vent side seams, and reinforced two-button placket.";
                    }
                    if (cat.includes("TROUSER") || cat.includes("PANT") || cat.includes("CHINO")) {
                      return "Constructed from heavy stretch cotton twill and high-tensile ripstop. Features articulated mobility knee darts, deep utility slant pockets, and reinforced stress bar-tacks.";
                    }
                    return "Engineered with premium natural cotton fibers and reinforced stitching for supreme endurance and everyday comfort.";
                  })()}
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
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", width: "100%", height: "80vh" }}>
            <Image
              src={gallery[selectedImage]}
              alt={product.name}
              fill
              sizes="90vw"
              style={{ objectFit: "contain" }}
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
                zIndex: 10,
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
        category={product.category}
        productName={product.name}
      />

      <StoreStockModal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        product={product}
        selectedSize={selectedSize}
      />

      <BankOffersModal
        isOpen={bankOffersOpen}
        onClose={() => setBankOffersOpen(false)}
      />

      <style>{`
        @media (max-width: 768px) {
          .product-detail-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </div>
  );
}
