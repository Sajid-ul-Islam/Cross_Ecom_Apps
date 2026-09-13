"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import type { HeroBannerState, HeroSlide } from "@/lib/api";

interface HeroSliderProps {
  bannerData: HeroBannerState;
}

interface HeroVideoItemProps {
  videoUrl: string;
  poster: string;
  isActive: boolean;
  isFirst: boolean;
  onEnded?: () => void;
}

function HeroVideoItem({ videoUrl, poster, isActive, isFirst, onEnded }: HeroVideoItemProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Synchronously ensure muted DOM property is true
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el) {
      el.muted = true;
      el.defaultMuted = true;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    if (isActive) {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Browser autoplay policy blocked; resume on user gesture
          const resumeOnGesture = () => {
            if (videoRef.current && isActive) {
              videoRef.current.play().catch(() => {});
            }
            window.removeEventListener("pointerdown", resumeOnGesture);
            window.removeEventListener("touchstart", resumeOnGesture);
          };
          window.addEventListener("pointerdown", resumeOnGesture, { once: true, passive: true });
          window.addEventListener("touchstart", resumeOnGesture, { once: true, passive: true });
        });
      }
    } else {
      video.pause();
    }
  }, [isActive]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <video
        ref={setVideoRef}
        src={videoUrl}
        autoPlay
        muted
        playsInline
        preload={isFirst ? "auto" : "metadata"}
        poster={poster}
        onEnded={() => {
          if (isActive && onEnded) {
            onEnded();
          }
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
    </div>
  );
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

  const currentSlide = slides[current];

  // Auto-advance: videos advance when full video finishes (onEnded); static images advance after 5.5s
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    if (currentSlide?.videoUrl) {
      // 30s safety watchdog in case network stalls or video fails to buffer
      const watchdog = setTimeout(nextSlide, 30000);
      return () => clearTimeout(watchdog);
    }

    const timer = setTimeout(nextSlide, 5500);
    return () => clearTimeout(timer);
  }, [isPaused, slides.length, nextSlide, current, currentSlide?.videoUrl]);

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
    <>
      <style>{`
        .hero-slider-clean {
          position: relative;
          width: 100%;
          overflow: hidden;
          background-color: #080c14;
          margin-bottom: 28px;
        }
        /* Desktop aspect ratio: dynamic responsive widescreen that scales gracefully across screens */
        @media (min-width: 769px) {
          .hero-slider-clean {
            aspect-ratio: 21 / 9;
            min-height: 280px;
            max-height: 480px;
          }
          .hero-slider-clean img {
            object-fit: cover;
            object-position: center 30%;
          }
        }
        /* Dynamic Mobile screen ratio: 16:9 ratio prevents taking over the whole screen and prevents cut-offs */
        @media (max-width: 768px) {
          .hero-slider-clean {
            aspect-ratio: 16 / 9;
            min-height: 190px;
            max-height: 280px;
            margin-bottom: 18px;
          }
          .hero-slider-clean img {
            object-fit: cover !important;
            object-position: center center !important;
          }
          .hero-slider-nav-btn {
            display: none !important; /* On mobile, touch swipe provides a cleaner, full-bleed experience */
          }
        }
      `}</style>

      <section
        className="hero-slider-clean"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="DEEN Official Collection"
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
                transform: isActive ? "scale(1)" : "scale(1.025)",
                transition: "opacity 800ms cubic-bezier(0.25, 1, 0.5, 1), transform 1200ms cubic-bezier(0.25, 1, 0.5, 1)",
                zIndex: isActive ? 2 : 1,
                cursor: "pointer",
              }}
            >
              {slide.videoUrl ? (
                <HeroVideoItem
                  videoUrl={slide.videoUrl}
                  poster={slide.desktop}
                  isActive={isActive}
                  isFirst={index === 0}
                  onEnded={nextSlide}
                />
              ) : (
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
                      display: "block",
                      transform: isActive ? "scale(1)" : "scale(1.025)",
                      transition: "transform 5000ms ease-out",
                    }}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding={index === 0 ? "sync" : "async"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                  />
                </picture>
              )}
            </Link>
          );
        })}

        {/* Desktop Slide Navigation Controls */}
        {slides.length > 1 && (
          <>
            {/* Previous Arrow */}
            <button
              type="button"
              className="hero-slider-nav-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prevSlide();
              }}
              aria-label="Previous Slide"
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: "rgba(0, 0, 0, 0.4)",
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Next Arrow */}
            <button
              type="button"
              className="hero-slider-nav-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextSlide();
              }}
              aria-label="Next Slide"
              style={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: "rgba(0, 0, 0, 0.4)",
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {/* Minimal Indicators (Accessible & Elevated for Mobile) */}
            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                display: "flex",
                gap: 7,
                alignItems: "center",
                padding: "6px 12px",
                borderRadius: 999,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(8px)",
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
                    width: idx === current ? 26 : 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: idx === current ? "#FFFFFF" : "rgba(255, 255, 255, 0.45)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
