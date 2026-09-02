"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { fetchProducts, CATEGORIES, type Product, type Category } from "@/lib/api";
import { getCategoryInfo } from "@/lib/categories";
import ProductCard from "@/components/ProductCard";

interface ShopClientProps {
  initialProducts: Product[];
  initialCategory: Category;
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
  initialSearch,
  initialSort,
  remoteCovers,
}: ShopClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<Category>(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState(initialSort);

  const handleFilterChange = useCallback(async (newCat: Category, newSearch: string, newSort: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (newCat !== "ALL") params.set("category", newCat);
    if (newSearch.trim()) params.set("search", newSearch.trim());
    if (newSort !== "default") params.set("sort", newSort);

    router.replace(`/shop?${params.toString()}`, { scroll: false });

    try {
      const data = await fetchProducts({
        category: newCat,
        search: newSearch,
        sort: newSort,
      });
      setProducts(data);
    } catch {
      // Keep existing products if network hiccup occurs
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleCategory = (c: Category) => {
    setCategory(c);
    handleFilterChange(c, search, sort);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    handleFilterChange(category, val, sort);
  };

  const handleSortChange = (val: string) => {
    setSort(val);
    handleFilterChange(category, search, val);
  };

  const catInfo = getCategoryInfo(category, remoteCovers);

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 4, letterSpacing: "-0.5px" }}>
          CATEGORIES &amp; SHOP
        </h1>
        <p style={{ color: "var(--sub)", fontSize: 13 }}>
          {loading ? "Updating catalog…" : `Showing ${products.length} products`}
          {category !== "ALL" ? ` in ${category}` : ""}
        </p>
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

      {/* Category Hero Banner — image from REST API */}
      {category !== "ALL" && (
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
          placeholder="Search jeans, panjabi, shirts, polo, combo…"
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
              setSearch("");
              handleFilterChange("ALL", "", sort);
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
