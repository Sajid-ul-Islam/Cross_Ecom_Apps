import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ShoppingBag,
  Heart,
  Truck,
  Sparkles,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
} from "../../src/components/Icons";
import { Colors } from "../../src/theme/colors";
import { fetchProductById, bdt, FREE_TEE_THRESHOLD } from "../../src/services/gateway";
import { Product, Variation } from "../../src/types";
import { useCart } from "../../src/context/CartContext";
import { useProfile } from "../../src/context/ProfileContext";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addToCart, totalItems } = useCart();
  const { profile } = useProfile();

  const [product, setProduct] = useState<Product | null>(null);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedVariationId, setSelectedVariationId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [addedNotice, setAddedNotice] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("fabric");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchProductById(id).then((p) => {
      if (p) {
        setProduct(p);
        const vars: Variation[] = p.variations ?? [];
        setVariations(vars);
        const gallery = p.gallery?.length ? p.gallery : p.images;
        // Auto select user's preferred size if matching
        const sizes = vars.length ? vars.map((v) => v.size) : p.sizes;
        let initial = "";
        if (p.category === "JEANS" && sizes.includes(profile.jeansSize)) initial = profile.jeansSize;
        else if (sizes.includes(profile.topSize)) initial = profile.topSize;
        else if (sizes.length > 0) initial = sizes[0];
        setSelectedSize(initial);
        const v = vars.find((x) => x.size === initial);
        setSelectedVariationId(v?.id);
      }
      setLoading(false);
    });
  }, [id, profile]);

  const galleryImages = product?.gallery?.length ? product.gallery : product?.images ?? [];

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.indigo} />
        </View>
      </SafeAreaView>
    );
  }

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const currentPrice = product.salePrice ?? product.price;

  const handleSizeSelect = (s: string) => {
    setSelectedSize(s);
    const v = variations.find((x) => x.size === s);
    setSelectedVariationId(v?.id);
  };

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addToCart(product, selectedSize, 1, selectedVariationId);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  const handleBuyNow = () => {
    if (!selectedSize) return;
    addToCart(product, selectedSize, 1, selectedVariationId);
    router.push("/(tabs)/bag");
  };

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Custom Navigation Header */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={Colors.ink} />
        </TouchableOpacity>

        <Text style={styles.navTitle} numberOfLines={1}>
          {product.sku}
        </Text>

        <TouchableOpacity
          style={styles.bagBtn}
          onPress={() => router.push("/(tabs)/bag")}
        >
          <ShoppingBag size={20} color={Colors.ink} />
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {addedNotice && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>
            ✓ Added {product.name} ({selectedSize}) to bag!
          </Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Main Product Image Carousel */}
        <View style={styles.imageGallery}>
          <Image
            source={{ uri: galleryImages[activeImageIdx] || product.images[0] }}
            style={styles.mainImage}
            resizeMode="cover"
          />

          {/* Thumbnail switcher */}
          <View style={styles.thumbRow}>
            {galleryImages.map((img, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.thumbBtn, activeImageIdx === idx && styles.thumbBtnActive]}
                onPress={() => setActiveImageIdx(idx)}
              >
                <Image source={{ uri: img }} style={styles.thumbImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Product Meta */}
        <View style={styles.metaContainer}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryText}>{product.category}</Text>
            {product.isNew && (
              <View style={styles.newPill}>
                <Text style={styles.newPillText}>NEW DROP</Text>
              </View>
            )}
          </View>

          <Text style={styles.productName}>{product.name}</Text>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{bdt(currentPrice)}</Text>
            {hasDiscount && (
              <>
                <Text style={styles.origPrice}>{bdt(product.price)}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    {product.salePct ? `-${product.salePct}%` : `SAVE ${bdt(product.price - (product.salePrice || 0))}`}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Blurb */}
          <Text style={styles.blurb}>{product.blurb}</Text>

          {/* Fabric Badge */}
          <View style={styles.fabricHighlight}>
            <Layers size={16} color={Colors.indigoDark} />
            <Text style={styles.fabricHighlightText}>{product.fabric}</Text>
          </View>

          {/* Size Selector */}
          <View style={styles.sizeSection}>
            <View style={styles.sizeHeader}>
              <Text style={styles.sizeSectionTitle}>SELECT SIZE</Text>
              <Text style={styles.sizeGuideHint}>Fits True to Size (BD)</Text>
            </View>

            <View style={styles.sizeGrid}>
              {product.sizes.map((s) => {
                const isSelected = selectedSize === s;
                const varStock = variations.find((v) => v.size === s)?.stock;
                const oos = varStock === "outofstock";
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.sizeOption,
                      isSelected && styles.sizeOptionActive,
                      oos && styles.sizeOptionDisabled,
                    ]}
                    activeOpacity={0.75}
                    disabled={oos}
                    onPress={() => handleSizeSelect(s)}
                  >
                    <Text style={[styles.sizeOptionText, isSelected && styles.sizeOptionTextActive, oos && styles.sizeOptionTextDisabled]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedSize && (
              <Text style={styles.sizeStockHint}>
                {(() => {
                  const v = variations.find((x) => x.size === selectedSize);
                  if (!v) return product.stockStatus === "outofstock" ? "Out of stock" : "In stock";
                  return v.stock === "outofstock" ? "❌ Out of stock in this size" : "✓ In stock";
                })()}
              </Text>
            )}
          </View>

          {/* Free Gift Promo Tag */}
          <View style={styles.promoTag}>
            <Sparkles size={16} color={Colors.emerald} />
            <Text style={styles.promoTagText}>
              Eligible for <Text style={styles.bold}>FREE 240 GSM T-Shirt</Text> on total orders over ৳3,500.
            </Text>
          </View>

          {/* Accordion Details */}
          <View style={styles.accordionContainer}>
            {/* Fabric & Specs */}
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleSection("fabric")}
            >
              <Text style={styles.accordionTitle}>FABRIC &amp; SPECIFICATIONS</Text>
              {expandedSection === "fabric" ? (
                <ChevronUp size={18} color={Colors.ink} />
              ) : (
                <ChevronDown size={18} color={Colors.ink} />
              )}
            </TouchableOpacity>
            {expandedSection === "fabric" && (
              <View style={styles.accordionBody}>
                <Text style={styles.accordionBodyText}>
                  • Composition: {product.fabric}{"\n"}
                  • Dye Process: Traditional deep rope-dyed pure indigo{"\n"}
                  • Hardware: Solid embossed copper rivets &amp; YKK brass zipper{"\n"}
                  • Stitching: High-tensile poly-core tobacco stitch thread{"\n"}
                  • Origin: Proudly woven &amp; crafted in Bangladesh
                </Text>
              </View>
            )}

            {/* Wash & Care */}
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleSection("care")}
            >
              <Text style={styles.accordionTitle}>CARE &amp; WASHING INSTRUCTIONS</Text>
              {expandedSection === "care" ? (
                <ChevronUp size={18} color={Colors.ink} />
              ) : (
                <ChevronDown size={18} color={Colors.ink} />
              )}
            </TouchableOpacity>
            {expandedSection === "care" && (
              <View style={styles.accordionBody}>
                <Text style={styles.accordionBodyText}>
                  • Wash inside-out in cold water (below 30°C){"\n"}
                  • Use mild color-safe liquid detergent{"\n"}
                  • Do not bleach or tumble dry; line dry in shade{"\n"}
                  • Authentic indigo will develop unique fade patterns over time
                </Text>
              </View>
            )}

            {/* Shipping & Delivery */}
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleSection("shipping")}
            >
              <Text style={styles.accordionTitle}>DELIVERY &amp; RETURN POLICY</Text>
              {expandedSection === "shipping" ? (
                <ChevronUp size={18} color={Colors.ink} />
              ) : (
                <ChevronDown size={18} color={Colors.ink} />
              )}
            </TouchableOpacity>
            {expandedSection === "shipping" && (
              <View style={styles.accordionBody}>
                <Text style={styles.accordionBodyText}>
                  • Inside Dhaka: ৳70 (Delivered within 24-48 hours){"\n"}
                  • Outside Dhaka: ৳130 (Delivered within 3-5 days){"\n"}
                  • Cash on Delivery (COD), bKash &amp; Nagad accepted{"\n"}
                  • 7-day hassle-free size exchange policy
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.addToCartBtn}
          activeOpacity={0.85}
          onPress={handleAddToCart}
        >
          <ShoppingBag size={18} color={Colors.indigoDark} />
          <Text style={styles.addToCartBtnText}>ADD TO BAG</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyNowBtn}
          activeOpacity={0.88}
          onPress={handleBuyNow}
        >
          <Text style={styles.buyNowBtnText}>BUY NOW ({bdt(currentPrice)})</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.sub,
    letterSpacing: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bagBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.crimson,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  toastBanner: {
    backgroundColor: Colors.emerald,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageGallery: {
    width: "100%",
    backgroundColor: Colors.cardSecondary,
    position: "relative",
  },
  mainImage: {
    width: width,
    height: width * 1.1,
  },
  thumbRow: {
    position: "absolute",
    bottom: 12,
    left: 16,
    flexDirection: "row",
    gap: 8,
  },
  thumbBtn: {
    width: 48,
    height: 48,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.6)",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  thumbBtnActive: {
    borderColor: Colors.indigo,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  metaContainer: {
    padding: 16,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.sub,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  newPill: {
    backgroundColor: Colors.indigo,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newPillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  productName: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.ink,
    lineHeight: 26,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  price: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.indigoDark,
  },
  origPrice: {
    fontSize: 16,
    color: Colors.faint,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: Colors.crimsonLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountText: {
    color: Colors.crimson,
    fontSize: 11,
    fontWeight: "800",
  },
  blurb: {
    fontSize: 13,
    color: Colors.sub,
    lineHeight: 20,
    marginBottom: 14,
  },
  fabricHighlight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  fabricHighlightText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.indigoDark,
    flex: 1,
  },
  sizeSection: {
    marginBottom: 16,
  },
  sizeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sizeSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.ink,
    letterSpacing: 0.8,
  },
  sizeGuideHint: {
    fontSize: 11,
    color: Colors.sub,
  },
  sizeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sizeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 50,
    alignItems: "center",
  },
  sizeOptionActive: {
    backgroundColor: Colors.indigoDark,
    borderColor: Colors.indigoDark,
  },
  sizeOptionText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.ink,
  },
  sizeOptionTextActive: {
    color: "#FFFFFF",
  },
  sizeOptionDisabled: {
    backgroundColor: Colors.cardSecondary,
    borderColor: Colors.borderLight,
  },
  sizeOptionTextDisabled: {
    color: Colors.faint,
    textDecorationLine: "line-through",
  },
  sizeStockHint: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.sub,
  },
  promoTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.emeraldLight,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.emerald,
    marginBottom: 16,
  },
  promoTagText: {
    fontSize: 11,
    color: Colors.emerald,
    flex: 1,
  },
  bold: {
    fontWeight: "700",
  },
  accordionContainer: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  accordionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.ink,
    letterSpacing: 0.6,
  },
  accordionBody: {
    padding: 14,
    backgroundColor: Colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  accordionBodyText: {
    fontSize: 12,
    color: Colors.sub,
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addToCartBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.indigoDark,
    letterSpacing: 0.8,
  },
  buyNowBtn: {
    flex: 1.2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: Colors.indigo,
  },
  buyNowBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
});
