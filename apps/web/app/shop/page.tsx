import { Suspense } from "react";
import type { Metadata } from "next";
import { fetchProducts, fetchCategoryCovers, type Category } from "@/lib/api";
import ShopClient from "@/components/ShopClient";

interface ShopPageProps {
  searchParams: {
    category?: string;
    search?: string;
    sort?: string;
  };
}

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const category = searchParams.category ? searchParams.category.toUpperCase() : "ALL";
  const title = category !== "ALL" ? `${category} Collection | DEEN` : "All Apparel & Denim | DEEN Official Store";
  const description =
    category !== "ALL"
      ? `Browse DEEN's premium collection of ${category} crafted with high-durability fabrics and artisanal details.`
      : "Shop raw selvedge denim, shirts, panjabis, polos, and trousers online with nationwide doorstep delivery across Bangladesh.";

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
  const search = searchParams.search || "";
  const sort = searchParams.sort || "default";

  const [products, remoteCovers] = await Promise.all([
    fetchProducts({ category, search, sort }),
    fetchCategoryCovers(),
  ]);

  return (
    <Suspense fallback={<div className="container" style={{ padding: "80px 0", textAlign: "center" }}><div className="spinner" /></div>}>
      <ShopClient
        initialProducts={products}
        initialCategory={category}
        initialSearch={search}
        initialSort={sort}
        remoteCovers={remoteCovers}
      />
    </Suspense>
  );
}
