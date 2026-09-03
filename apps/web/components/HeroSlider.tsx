"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import type { HeroBannerState, HeroSlide } from "@/lib/api";

interface HeroSliderProps {
  bannerData: HeroBannerState;
}

export default function HeroSlider({ bannerData }: HeroSliderProps) {
  const slides: HeroSlide[] =
    bannerData?.slides && bannerData.slides.length > 0
      ? bannerData.slides
      : [
          {
            id: "slide_denim",
            desktop: "https://deencommerce.com/wp-content/uploads/2026/08/web-banner-2.jpg",
            mobile: "https://deencommerce.com/wp-content/uploads/2026/08/Mobile-Hero-Banner.jpg",
            badge: "",
            title: "",
            headline: "",
            subtitle: "",
            actionUrl: "/shop?category=JEANS",
            actionLabel: "Shop Denim",
          },
        ];

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-advance slideshow every 5 seconds
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length, nextSlide]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 40) {
      nextSlide();
    } else if (diff < -40) {
      prevSlide();
    }
    touchStartX.current = null;
  };

  return (
    <section
      className="hero-slider-clean"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="DEEN Official Collection"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1920 / 720",
        minHeight: 280,
        maxHeight: 680,
        overflow: "hidden",
        backgroundColor: "#000",
      }}
    >
      {/* Slides (Edge-to-Edge Pure Photography) */}
      {slides.map((slide, index) => {
        const isActive = index === current;
        return (
          <Link
            key={slide.id || index}
            href={slide.actionUrl || "/shop"}
            aria-hidden={!isActive}
            style={{
              position: "absolute",
              inset: 0,
              display: "block",
              opacity: isActive ? 1 : 0,
              visibility: isActive ? "visible" : "hidden",
              transform: isActive ? "scale(1)" : "scale(1.03)",
              transition: "opacity 800ms cubic-bezier(0.25, 1, 0.5, 1), transform 1200ms cubic-bezier(0.25, 1, 0.5, 1)",
              zIndex: isActive ? 2 : 1,
              cursor: "pointer",
            }}
          >
            <picture style={{ width: "100%", height: "100%", display: "block" }}>
              <source media="(max-width: 768px)" srcSet={slide.mobile || slide.desktop} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.desktop}
                alt={slide.headline || slide.title || "DEEN Collection Banner"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center center",
                  display: "block",
                  transform: isActive ? "scale(1)" : "scale(1.03)",
                  transition: "transform 5000ms ease-out",
                }}
                loading={index === 0 ? "eager" : "lazy"}
              />
            </picture>
          </Link>
        );
      })}

      {/* Subtle Slide Navigation Controls */}
      {slides.length > 1 && (
        <>
          {/* Previous Arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Previous Slide"
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: "rgba(0, 0, 0, 0.35)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(6px)",
              transition: "all 180ms ease",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Next Arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Next Slide"
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: "rgba(0, 0, 0, 0.35)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(6px)",
              transition: "all 180ms ease",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Minimal Bottom Indicators */}
          <div
            style={{
              position: "absolute",
              bottom: 14,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              display: "flex",
              gap: 6,
              alignItems: "center",
              padding: "4px 10px",
              borderRadius: 999,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(6px)",
            }}
          >
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrent(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                style={{
                  width: idx === current ? 24 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: idx === current ? "#FFFFFF" : "rgba(255, 255, 255, 0.45)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 250ms ease",
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
