"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { fetchProducts, CATEGORIES, type Product, type Category } from "@/lib/api";
import { getCategoryInfo } from "@/lib/categories";
import ProductCard from "@/components/ProductCard";

interface ShopClientProps {
  initialProducts: Product[];
  initialCategory: Category;
  initialSegment?: "all" | "collection" | "select";
  initialSearch: string;
  initialSort: string;
  remoteCovers: Record<string, string>;
}

const SORT_OPTIONS = [
  { value: "default", label: "Featured" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "new", label: "New Arrivals" },
];

export default function ShopClient({
  initialProducts,
  initialCategory,
  initialSegment = "all",
  initialSearch,
  initialSort,
  remoteCovers,
}: ShopClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<Category>(initialCategory);
  const [segment, setSegment] = useState<"all" | "collection" | "select">(initialSegment);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState(initialSort);

  const handleFilterChange = useCallback(
    async (
      newCat: Category,
      newSeg: "all" | "collection" | "select",
      newSearch: string,
      newSort: string
    ) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (newCat !== "ALL") params.set("category", newCat);
      if (newSeg !== "all") params.set("segment", newSeg);
      if (newSearch.trim()) params.set("search", newSearch.trim());
      if (newSort !== "default") params.set("sort", newSort);

      router.replace(`/shop?${params.toString()}`, { scroll: false });

      try {
        const data = await fetchProducts({
          category: newCat,
          segment: newSeg,
          search: newSearch,
          sort: newSort,
        });
        setProducts(data);
      } catch {
        // Keep existing products if network hiccup occurs
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const handleCategory = (c: Category) => {
    setCategory(c);
    handleFilterChange(c, segment, search, sort);
  };

  const handleSegmentChange = (s: "all" | "collection" | "select") => {
    setSegment(s);
    handleFilterChange(category, s, search, sort);
  };

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      handleFilterChange(category, segment, val, sort);
    }, 300);
  };

  const handleSortChange = (val: string) => {
    setSort(val);
    handleFilterChange(category, segment, search, val);
  };

  const catInfo =
    category !== "ALL"
      ? getCategoryInfo(category, remoteCovers)
      : segment === "select"
      ? getCategoryInfo("DEEN_SELECT", remoteCovers)
      : segment === "collection"
      ? getCategoryInfo("DEEN_COLLECTION", remoteCovers)
      : getCategoryInfo("ALL", remoteCovers);

  const showHeroBanner = category !== "ALL" || segment !== "all";

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      {/* Page header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 4, letterSpacing: "-0.5px" }}>
          CATEGORIES &amp; SHOP
        </h1>
        <p style={{ color: "var(--sub)", fontSize: 13 }}>
          {loading ? "Updating catalog…" : `Showing ${products.length} products`}
          {segment === "select"
            ? " in DEEN Select (Curated Drops)"
            : segment === "collection"
            ? " in DEEN Collection (Artisanal)"
            : ""}
          {category !== "ALL" ? ` · ${category}` : ""}
        </p>
      </div>

      {/* Brand Segment Switcher: DEEN Collection vs DEEN Select */}
      <div
        className="segment-pill-bar"
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          background: "var(--surface-2)",
          padding: 4,
          borderRadius: 30,
          border: "1px solid var(--border)",
          width: "fit-content",
          maxWidth: "100%",
          overflowX: "auto",
        }}
      >
        <button
          type="button"
          onClick={() => handleSegmentChange("all")}
          style={{
            padding: "8px 16px",
            borderRadius: 24,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.5px",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
            background: segment === "all" ? "var(--ink)" : "transparent",
            color: segment === "all" ? "var(--paper)" : "var(--sub)",
          }}
        >
          ALL APPAREL
        </button>
        <button
          type="button"
          onClick={() => handleSegmentChange("collection")}
          style={{
            padding: "8px 16px",
            borderRadius: 24,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.5px",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
            background: segment === "collection" ? "var(--indigo)" : "transparent",
            color: segment === "collection" ? "#FFFFFF" : "var(--sub)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>💎</span> DEEN COLLECTION
        </button>
        <button
          type="button"
          onClick={() => handleSegmentChange("select")}
          style={{
            padding: "8px 16px",
            borderRadius: 24,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.5px",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
            background: segment === "select" ? "#D97706" : "transparent",
            color: segment === "select" ? "#FFFFFF" : "var(--sub)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>⚡</span> DEEN SELECT
        </button>
      </div>

      {/* Visual Category Showcase Carousel — covers from REST API */}
      <div className="cat-visual-carousel">
        {CATEGORIES.map((c) => {
          const active = category === c;
          const info = getCategoryInfo(c, remoteCovers);
          return (
            <button
              key={c}
              type="button"
              className={`cat-visual-tile ${active ? "cat-visual-tile--active" : ""}`}
              onClick={() => handleCategory(c)}
            >
              {c !== "ALL" && info.coverImage ? (
                <div style={{ position: "relative", width: 52, height: 52, borderRadius: "50%", overflow: "hidden" }}>
                  <Image
                    src={info.coverImage}
                    alt={c}
                    fill
                    sizes="52px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              ) : (
                <div className="cat-visual-placeholder">ALL</div>
              )}
              <span className="cat-visual-name">{c}</span>
              {active && <span className="cat-visual-dot" />}
            </button>
          );
        })}
      </div>

      {/* Category or Segment Hero Banner — image from REST API */}
      {showHeroBanner && (
        <div
          className="category-hero-card"
          style={
            catInfo.coverImage
              ? {
                  backgroundImage: `linear-gradient(to right, rgba(10,15,30,0.92) 40%, rgba(10,15,30,0.5) 100%), url('${catInfo.coverImage}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center right",
                }
              : undefined
          }
        >
          <div className="category-hero-badge">{catInfo.metaBadge}</div>
          <h2 className="category-hero-title">{catInfo.title}</h2>
          <p className="category-hero-sub">{catInfo.description}</p>
        </div>
      )}

      {/* Search + Sort Bar */}
      <div className="filters-bar" style={{ marginTop: 16 }}>
        <input
          type="search"
          className="search-input"
          placeholder="Search by name, SKU, category…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <select
          className="sort-select"
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div className="spinner" />
          <p style={{ color: "var(--sub)", fontSize: 14 }}>Updating catalog…</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state" style={{ textAlign: "center", padding: "60px 20px" }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No products found</h3>
          <p style={{ color: "var(--sub)", fontSize: 13, marginBottom: 20 }}>
            Try changing your search terms or selecting another category.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setCategory("ALL");
              setSegment("all");
              setSearch("");
              handleFilterChange("ALL", "all", "", sort);
            }}
          >
            SHOW ALL PRODUCTS
          </button>
        </div>
      ) : (
        <div className="product-grid" style={{ marginTop: 20 }}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
