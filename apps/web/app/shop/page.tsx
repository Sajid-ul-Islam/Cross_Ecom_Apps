"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchProducts, fetchCategoryCovers, CATEGORIES, type Product, type Category } from "@/lib/api";
import { getCategoryInfo } from "@/lib/categories";
import ProductCard from "@/components/ProductCard";

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>(
    (searchParams.get("category") as Category) || "ALL"
  );
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState("default");

  // Remote category covers from REST API
  const [remoteCovers, setRemoteCovers] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCategoryCovers().then((covers) => {
      if (covers && Object.keys(covers).length > 0) setRemoteCovers(covers);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchProducts({ category, search, sort });
    setProducts(data);
    setLoading(false);
  }, [category, search, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCategory = (cat: Category) => {
    setCategory(cat);
    const params = new URLSearchParams(searchParams.toString());
    if (cat === "ALL") {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    router.replace(`/shop?${params.toString()}`, { scroll: false });
  };

  const SORT_OPTIONS = [
    { value: "default", label: "Featured" },
    { value: "price-asc", label: "Price: Low → High" },
    { value: "price-desc", label: "Price: High → Low" },
    { value: "name-asc", label: "Name A–Z" },
    { value: "new", label: "New Arrivals" },
  ];

  const catInfo = getCategoryInfo(category, remoteCovers);

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 4, letterSpacing: "-0.5px" }}>
          CATEGORIES &amp; SHOP
        </h1>
        <p style={{ color: "var(--sub)", fontSize: 13 }}>
          {loading ? "Fetching DEEN collection…" : `Showing ${products.length} products`}
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
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={info.coverImage}
                  alt={c}
                  className="cat-visual-img"
                />
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
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
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
          <p style={{ color: "var(--sub)", fontSize: 14 }}>Fetching catalog…</p>
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

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 40 }}><div className="spinner" /></div>}>
      <ShopContent />
    </Suspense>
  );
}
