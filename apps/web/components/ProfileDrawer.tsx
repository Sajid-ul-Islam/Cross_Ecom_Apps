"use client";

import React, { useEffect } from "react";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string | number;
}

export default function ProfileDrawer({
  isOpen,
  onClose,
  title,
  icon,
  subtitle,
  children,
  maxWidth = "480px",
}: ProfileDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 100000,
        display: "flex",
        justifyContent: "flex-end",
        animation: "drawerFadeIn 0.2s ease-out",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <style>{`
        @keyframes drawerFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes drawerSlideRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes drawerSlideBottom {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .profile-drawer-panel {
          width: 100%;
          max-width: ${typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth};
          height: 100%;
          background: var(--surface);
          background-color: var(--surface);
          box-shadow: -10px 0 36px rgba(0, 0, 0, 0.35);
          display: flex;
          flex-direction: column;
          animation: drawerSlideRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          position: relative;
        }
        @media (max-width: 768px) {
          .profile-drawer-panel {
            max-width: 100%;
            height: 90vh;
            margin-top: auto;
            border-top-left-radius: 20px;
            border-top-right-radius: 20px;
            animation: drawerSlideBottom 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
        }
      `}</style>

      <div
        className="profile-drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface-2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            {icon && (
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: "rgba(99, 102, 241, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                  color: "var(--indigo)",
                }}
              >
                {icon}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 900,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {title}
              </h3>
              {subtitle && (
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 11.5,
                    color: "var(--sub)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--sub)",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              flexShrink: 0,
              marginLeft: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--ink)";
              e.currentTarget.style.borderColor = "var(--indigo)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--sub)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            ✕
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div
          style={{
            padding: "20px",
            overflowY: "auto",
            flex: 1,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
