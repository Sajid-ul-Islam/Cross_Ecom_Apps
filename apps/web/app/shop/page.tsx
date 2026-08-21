"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchProducts, CATEGORIES, type Product, type Category } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export default function ShopPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>(
    (searchParams.get("category") as Category) || "ALL"
  );
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState("default");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchProducts({ category, search, sort });
    setProducts(data);
    setLoading(false);
  }, [category, search, sort]);

  useEffect(() => { load(); }, [load]);

  const handleCategory = (cat: Category) => {
    setCategory(cat);
    const params = new URLSearchParams(searchParams.toString());
    cat === "ALL" ? params.delete("category") : params.set("category", cat);
    router.replace(`/shop?${params.toString()}`, { scroll: false });
  };

  const SORT_OPTIONS = [
    { value: "default", label: "Default" },
    { value: "price-asc", label: "Price: Low → High" },
    { value: "price-desc", label: "Price: High → Low" },
    { value: "name-asc", label: "Name A–Z" },
    { value: "new", label: "New Arrivals" },
  ];

  return (
    <div className="container" style={{ paddingBottom: 60 }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--ink)", marginBottom: 6 }}>
          Shop
        </h1>
        <p style={{ color: "var(--sub)", fontSize: 14 }}>
          {loading ? "Loading..." : `${products.length} products`}
          {category !== "ALL" ? ` in ${category}` : ""}
        </p>
      </div>

      {/* Category chips */}
      <div className="cat-chips">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`cat-chip${category === c ? " cat-chip--active" : ""}`}
            onClick={() => handleCategory(c)}
          >
            {c === "ALL" ? "All Products" : c.charAt(0) + c.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="filters-bar">
        <input
          type="search"
          className="search-input"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div className="spinner" />
          <p style={{ color: "var(--sub)", fontSize: 14 }}>Loading products…</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🔍</div>
          <h2 className="empty-state__title">No products found</h2>
          <p className="empty-state__sub">Try a different category or search term</p>
          <button className="btn btn-primary" onClick={() => { setSearch(""); setCategory("ALL"); }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
