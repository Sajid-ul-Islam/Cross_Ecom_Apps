"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { SocialFeedData, SocialReel, Product } from "@/lib/api";
import { useCart } from "@/lib/cart";

interface StoriesFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedData: SocialFeedData;
  initialIndex?: number;
}

export default function StoriesFeedModal({
  isOpen,
  onClose,
  feedData,
  initialIndex = 0,
}: StoriesFeedModalProps) {
  const { addItem } = useCart();
  const reels = feedData?.reels && feedData.reels.length > 0 ? feedData.reels : [];
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likesState, setLikesState] = useState<Record<string, { count: number; userLiked: boolean }>>({});
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(initialIndex);
      setIsPlaying(true);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowDown" || e.key === "ArrowRight") nextReel();
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") prevReel();
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, initialIndex]);

  // Sync likes state
  useEffect(() => {
    if (reels.length > 0) {
      const initialMap: Record<string, { count: number; userLiked: boolean }> = {};
      reels.forEach((r) => {
        initialMap[r.id] = { count: r.likes, userLiked: false };
      });
      setLikesState(initialMap);
    }
  }, [reels]);

  const currentReel: SocialReel | undefined = reels[activeIndex];

  const nextReel = () => {
    if (activeIndex < reels.length - 1) {
      setActiveIndex((prev) => prev + 1);
    } else {
      setActiveIndex(0); // loop back
    }
  };

  const prevReel = () => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    } else {
      setActiveIndex(reels.length - 1);
    }
  };

  const toggleLike = (reelId: string) => {
    setLikesState((prev) => {
      const current = prev[reelId] || { count: 0, userLiked: false };
      const nextLiked = !current.userLiked;
      return {
        ...prev,
        [reelId]: {
          count: nextLiked ? current.count + 1 : current.count - 1,
          userLiked: nextLiked,
        },
      };
    });
  };

  const handleScreenDoubleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected!
      if (currentReel) {
        if (!likesState[currentReel.id]?.userLiked) {
          toggleLike(currentReel.id);
        }
        setShowHeartBurst(true);
        setTimeout(() => setShowHeartBurst(false), 800);
      }
    } else {
      // Single tap -> toggle play/pause
      if (videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play();
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    }
    lastTapRef.current = now;
  };

  const handleAddToCart = (taggedProduct: SocialReel["taggedProduct"]) => {
    if (!taggedProduct) return;
    const prod: Product = {
      id: taggedProduct.id,
      name: taggedProduct.name,
      sku: `SKU-${taggedProduct.id}`,
      category: taggedProduct.category || "JEANS",
      price: taggedProduct.price,
      regularPrice: taggedProduct.regularPrice,
      sizes: ["M", "L", "XL"],
      images: [taggedProduct.image, taggedProduct.image],
      stockStatus: "instock",
      rating: 4.9,
      ratingCount: 24,
    };
    addItem(prod, "L");
    setAddedToast(`Added "${taggedProduct.name}" to Bag!`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  if (!isOpen || !currentReel) return null;

  const currentLikes = likesState[currentReel.id] || { count: currentReel.likes, userLiked: false };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Stories & Reels Feed"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        backgroundColor: "rgba(0, 0, 0, 0.92)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Toast */}
      {addedToast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10002,
            backgroundColor: "rgba(16, 185, 129, 0.95)",
            color: "#FFFFFF",
            padding: "10px 20px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>✓</span>
          <span>{addedToast}</span>
        </div>
      )}

      {/* Main Reel Container (Phone aspect ratio on desktop, full bleed on mobile) */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 440,
          height: "100%",
          maxHeight: 880,
          backgroundColor: "#000000",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.8)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Progress Bar Bars at Top */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 12,
            right: 12,
            zIndex: 20,
            display: "flex",
            gap: 4,
          }}
        >
          {reels.map((r, idx) => (
            <div
              key={r.id}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor: idx <= activeIndex ? "#FFFFFF" : "rgba(255, 255, 255, 0.3)",
                transition: "background-color 200ms ease",
              }}
            />
          ))}
        </div>

        {/* Top Header Bar */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 16,
            right: 16,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://deencommerce.com/wp-content/uploads/2025/11/Jeans.webp"
              alt="DEEN Logo"
              style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #6366f1" }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#FFFFFF" }}>{currentReel.author}</span>
                <span style={{ fontSize: 11, color: "#60a5fa" }}>● Verified</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.7)" }}>
                {currentReel.platform === "instagram" ? "📸 Instagram Reel" : "📘 Facebook Video"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Mute/Unmute */}
            <button
              type="button"
              onClick={() => {
                setIsMuted(!isMuted);
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                }
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Close Stories Feed"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Video / Visual Content Area */}
        <div
          onClick={handleScreenDoubleTap}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {currentReel.videoUrl ? (
            <video
              ref={videoRef}
              key={currentReel.id}
              src={currentReel.videoUrl}
              poster={currentReel.poster}
              autoPlay
              loop
              playsInline
              muted={isMuted}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentReel.poster}
              alt={currentReel.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}

          {/* Pause overlay icon */}
          {!isPlaying && (
            <div
              style={{
                position: "absolute",
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: 28,
              }}
            >
              ▶
            </div>
          )}

          {/* Heart burst animation on double tap */}
          {showHeartBurst && (
            <div
              style={{
                position: "absolute",
                fontSize: 72,
                animation: "heartBurst 750ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                pointerEvents: "none",
              }}
            >
              ❤️
            </div>
          )}
        </div>

        {/* Floating Right Actions (Like, Views, External link) */}
        <div
          style={{
            position: "absolute",
            right: 14,
            bottom: currentReel.taggedProduct ? 120 : 60,
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Like Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(currentReel.id);
            }}
            style={{
              background: "none",
              border: "none",
              color: currentLikes.userLiked ? "#ef4444" : "#FFFFFF",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
            aria-label="Like this reel"
          >
            <span style={{ fontSize: 26 }}>{currentLikes.userLiked ? "❤️" : "🤍"}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF" }}>{currentLikes.count}</span>
          </button>

          {/* Views */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: "#FFFFFF" }}>
            <span style={{ fontSize: 22 }}>👁️</span>
            <span style={{ fontSize: 11, fontWeight: 700 }}>{currentReel.views}</span>
          </div>

          {/* Direct Link to Instagram / Facebook */}
          <a
            href={currentReel.permalink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              textDecoration: "none",
            }}
            title={`Open on ${currentReel.platform}`}
          >
            ↗
          </a>
        </div>

        {/* Bottom Details & Tagged Product Card */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "16px 14px",
            background: "linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.5) 70%, transparent 100%)",
            zIndex: 20,
          }}
        >
          {/* Caption */}
          <p
            style={{
              fontSize: 12,
              color: "rgba(255, 255, 255, 0.9)",
              lineHeight: 1.4,
              marginBottom: 10,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {currentReel.caption}
          </p>

          {/* Shoppable Tagged Product Box */}
          {currentReel.taggedProduct && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentReel.taggedProduct.image}
                  alt={currentReel.taggedProduct.name}
                  style={{ width: 42, height: 42, borderRadius: 6, objectFit: "cover" }}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {currentReel.taggedProduct.name}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#4ade80" }}>
                    ৳{currentReel.taggedProduct.price.toLocaleString("en-BD")}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Link
                  href={`/product/${currentReel.taggedProduct.id}`}
                  onClick={onClose}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  View
                </Link>

                <button
                  type="button"
                  onClick={() => handleAddToCart(currentReel.taggedProduct)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    background: "var(--indigo)",
                    color: "#FFFFFF",
                    border: "none",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Add to Bag
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Left / Right Nav Arrows (Desktop helper) */}
        {reels.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevReel}
              style={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.4)",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
                zIndex: 25,
              }}
              aria-label="Previous story"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={nextReel}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.4)",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
                zIndex: 25,
              }}
              aria-label="Next story"
            >
              ›
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes heartBurst {
          0% { transform: scale(0.2); opacity: 0; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1.1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
