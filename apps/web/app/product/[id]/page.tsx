import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchProduct, fetchProducts, fetchDeliveryFees, resolveProductImage, type Product } from "@/lib/api";
import ProductDetailClient from "@/components/ProductDetailClient";

interface ProductPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await fetchProduct(params.id);
  if (!product) {
    return {
      title: "Product Not Found | DEEN",
      description: "The requested apparel item is not available.",
    };
  }

  const primaryImage = product.images?.[0] ? resolveProductImage(product.images[0]) : undefined;

  return {
    title: `${product.name} | DEEN Official Store`,
    description: product.blurb || `Shop ${product.name} crafted from artisanal selvedge denim and premium contemporary fabrics at DEEN.`,
    openGraph: {
      title: `${product.name} | DEEN`,
      description: product.blurb || `Shop ${product.name} online with nationwide 64 districts doorstep delivery.`,
      images: primaryImage ? [{ url: primaryImage, width: 800, height: 1067, alt: product.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.blurb,
      images: primaryImage ? [primaryImage] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const product = await fetchProduct(params.id);
  if (!product) {
    notFound();
  }

  const [related, deliveryFees] = await Promise.all([
    product.category
      ? fetchProducts({ category: product.category, per_page: 4 }).then((res) =>
          res.filter((item: Product) => String(item.id) !== String(params.id)).slice(0, 4)
        )
      : Promise.resolve([]),
    fetchDeliveryFees(),
  ]);

  return (
    <ProductDetailClient
      product={product}
      related={related}
      deliveryFees={deliveryFees}
    />
  );
}
