import { Suspense } from "react";
import type { Metadata } from "next";
import { fetchProducts, fetchCategoryCovers, type Category } from "@/lib/api";
import ShopClient from "@/components/ShopClient";

interface ShopPageProps {
  searchParams: {
    category?: string;
    segment?: string;
    search?: string;
    sort?: string;
  };
}

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const category = searchParams.category ? searchParams.category.toUpperCase() : "ALL";
  const segment = (searchParams.segment || "all").toLowerCase();

  let title = "All Apparel & Denim | DEEN Official Store";
  let description = "Shop raw selvedge denim, shirts, panjabis, polos, and trousers online with nationwide doorstep delivery across Bangladesh.";

  if (segment === "select") {
    title = "DEEN Select — Curated International Drops | DEEN Official";
    description = "Exclusive curated international apparel drops: Springfield, Pull & Bear, Lefties, and global labels delivered across Bangladesh.";
  } else if (segment === "collection") {
    title = "DEEN Collection — Artisanal In-House Craft | DEEN Official";
    description = "Browse DEEN's signature in-house cross-hatch denim, heritage panjabis, and 240 GSM heavy cotton tees.";
  } else if (category !== "ALL") {
    title = `${category} Collection | DEEN`;
    description = `Browse DEEN's premium collection of ${category} crafted with high-durability fabrics and artisanal details.`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const category = (searchParams.category as Category) || "ALL";
  const segment = (searchParams.segment as "all" | "collection" | "select") || "all";
  const search = searchParams.search || "";
  const sort = searchParams.sort || "default";

  const [products, remoteCovers] = await Promise.all([
    fetchProducts({ category, segment, search, sort }),
    fetchCategoryCovers(),
  ]);

  return (
    <Suspense fallback={<div className="container" style={{ padding: "80px 0", textAlign: "center" }}><div className="spinner" /></div>}>
      <ShopClient
        initialProducts={products}
        initialCategory={category}
        initialSegment={segment}
        initialSearch={search}
        initialSort={sort}
        remoteCovers={remoteCovers}
      />
    </Suspense>
  );
}
