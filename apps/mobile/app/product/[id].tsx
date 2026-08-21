import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
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
  Ruler,
  Maximize2,
  CheckCircle2,
  Check,
  Star,
  Store,
  BookOpen,
  MessageCircle,
} from "../../src/components/Icons";
import { Colors } from "../../src/theme/colors";
import { useTheme } from "../../src/context/ThemeContext";
import { fetchProductById, fetchProducts, bdt, FREE_TEE_THRESHOLD } from "../../src/services/gateway";
import { Product, Variation } from "../../src/types";
import { useCart } from "../../src/context/CartContext";
import { useProfile } from "../../src/context/ProfileContext";
import { useWishlist } from "../../src/context/WishlistContext";
import { SizeGuideModal } from "../../src/components/SizeGuideModal";
import { ImageLightboxModal } from "../../src/components/ImageLightboxModal";
import { CompleteTheLook } from "../../src/components/CompleteTheLook";
import { StoreStockModal } from "../../src/components/StoreStockModal";
import { ProductReviewsModal } from "../../src/components/ProductReviewsModal";
import { DenimCareGuideModal } from "../../src/components/DenimCareGuideModal";
import { WhatsAppConciergeButton } from "../../src/components/WhatsAppConciergeButton";

const { width } = Dimensions.get("window");
const IMAGE_HEIGHT = Math.round(width * 1.16);

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { addToCart, totalItems } = useCart();
  const { profile } = useProfile();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedVariationId, setSelectedVariationId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [addedNotice, setAddedNotice] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("fabric");
  const [sizeGuideVisible, setSizeGuideVisible] = useState(false);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);
  const [careGuideVisible, setCareGuideVisible] = useState(false);

  const galleryScrollRef = useRef<ScrollView>(null);

  const isWishlisted = product ? isInWishlist(product.id) : false;

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    fetchProductById(id)
      .then((p) => {
        if (!isMounted) return;
        if (p) {
          setProduct(p);
          const vars: Variation[] = p.variations ?? [];
          setVariations(vars);
          const sizes = vars.length > 0 ? vars.map((v) => v.size) : (p.sizes?.length ? p.sizes : ["Standard"]);
          let initial = "";
          if (p.category === "JEANS" && sizes.includes(profile.jeansSize)) initial = profile.jeansSize;
          else if (sizes.includes(profile.topSize)) initial = profile.topSize;
          else if (sizes.length > 0) initial = sizes[0];
          setSelectedSize(initial);
          const v = vars.find((x) => x.size === initial);
          setSelectedVariationId(v?.id);
        } else {
          setProduct(null);
        }
      })
      .catch(() => {
        if (isMounted) setProduct(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, profile]);

  const rawGallery = product?.gallery?.length ? product.gallery : product?.images ?? [];
  const galleryImages = rawGallery.length > 0 ? rawGallery : ["https://images.unsplash.com/photo-1542272604-780c96856592?w=800"];

  const handleGalleryScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const nextIdx = Math.round(offsetX / width);
    if (nextIdx !== activeImageIdx && nextIdx >= 0 && nextIdx < galleryImages.length) {
      setActiveImageIdx(nextIdx);
    }
  };

  const jumpToGalleryImage = (idx: number) => {
    setActiveImageIdx(idx);
    galleryScrollRef.current?.scrollTo({
      x: idx * width,
      animated: true,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.indigo} />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.ink, marginBottom: 8 }}>
            Product Unavailable
          </Text>
          <Text style={{ fontSize: 13, color: Colors.sub, marginBottom: 16, textAlign: "center" }}>
            This item could not be loaded from the store.
          </Text>
          <TouchableOpacity
            style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.indigo, borderRadius: 6 }}
            onPress={() => router.replace("/(tabs)/shop")}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>BACK TO SHOP</Text>
          </TouchableOpacity>
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

  const savedSizeMatch =
    product.category === "JEANS"
      ? profile.jeansSize
      : profile.topSize;

  const isSavedMatch = selectedSize === savedSizeMatch;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]} edges={["top"]}>
      {/* Top Header */}
      <View style={[styles.navBar, { backgroundColor: colors.paper, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.cardSecondary }]}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={colors.ink} />
        </TouchableOpacity>

        <Text style={[styles.navTitle, { color: colors.ink }]} numberOfLines={1}>
          {product.sku}
        </Text>

        <TouchableOpacity
          style={[styles.bagBtn, { backgroundColor: colors.cardSecondary }]}
          onPress={() => router.push("/(tabs)/bag")}
        >
          <ShoppingBag size={20} color={colors.ink} />
          {totalItems > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.indigo }]}>
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
        {/* Superior Image Gallery Carousel */}
        <View style={styles.galleryWrapper}>
          <ScrollView
            ref={galleryScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleGalleryScroll}
            scrollEventThrottle={16}
            style={styles.galleryScroll}
          >
            {galleryImages.map((img, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.95}
                onPress={() => setLightboxVisible(true)}
                style={styles.slideItem}
              >
                <Image
                  source={{ uri: img }}
                  style={styles.mainHeroImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Floating Image Counter Badge */}
          <View style={styles.imageCounterBadge}>
            <Text style={styles.imageCounterText}>
              {activeImageIdx + 1} / {galleryImages.length}
            </Text>
          </View>

          {/* Floating Zoom & Lightbox Button */}
          <TouchableOpacity
            style={styles.zoomPill}
            activeOpacity={0.8}
            onPress={() => setLightboxVisible(true)}
          >
            <Maximize2 size={13} color="#FFFFFF" />
            <Text style={styles.zoomPillText}>TAP TO ZOOM</Text>
          </TouchableOpacity>

          {/* Wishlist Floating Button */}
          <TouchableOpacity
            style={[styles.wishlistBtn, isWishlisted && styles.wishlistBtnActive]}
            onPress={() => product && toggleWishlist(product)}
          >
            <Heart
              size={18}
              color={isWishlisted ? Colors.crimson : Colors.ink}
            />
          </TouchableOpacity>

          {/* Dots Indicator */}
          {galleryImages.length > 1 && (
            <View style={styles.dotsRow}>
              {galleryImages.map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.dot, activeImageIdx === idx && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Thumbnail Selector Strip */}
        {galleryImages.length > 1 && (
          <View style={styles.thumbStripWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbStrip}
            >
              {galleryImages.map((img, idx) => {
                const isSelected = activeImageIdx === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.thumbBtn, isSelected && styles.thumbBtnActive]}
                    onPress={() => jumpToGalleryImage(idx)}
                  >
                    <Image source={{ uri: img }} style={styles.thumbImage} resizeMode="cover" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Product Meta & Details */}
        <View style={styles.metaContainer}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryText}>{product.category}</Text>
            {product.isNew && (
              <View style={styles.newPill}>
                <Text style={styles.newPillText}>NEW DROP</Text>
              </View>
            )}
            {product.fabric && (
              <View style={styles.craftBadge}>
                <Text style={styles.craftBadgeText}>ARTISANAL</Text>
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

          {/* Size Selector with Size Chart Trigger */}
          <View style={styles.sizeSection}>
            <View style={styles.sizeHeader}>
              <View style={styles.sizeTitleWrap}>
                <Text style={styles.sizeSectionTitle}>SELECT SIZE</Text>
                <Text style={styles.sizeGuideHint}>
                  {product.category === "JEANS"
                    ? "Waist Size (Inches)"
                    : "Standard Fit (BD)"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.sizeGuideBtn}
                activeOpacity={0.8}
                onPress={() => setSizeGuideVisible(true)}
              >
                <Ruler size={14} color={Colors.indigoDark} />
                <Text style={styles.sizeGuideBtnText}>SIZE CHART</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sizeGrid}>
              {(variations.length > 0 ? variations.map((v) => v.size) : (product.sizes?.length ? product.sizes : ["Standard"])).map((s) => {
                const isSelected = selectedSize === s;
                const varStock = variations.find((v) => v.size === s)?.stock;
                const oos = varStock === "outofstock";
                const isUserPref = s === savedSizeMatch;

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
                    <Text
                      style={[
                        styles.sizeOptionText,
                        isSelected && styles.sizeOptionTextActive,
                        oos && styles.sizeOptionTextDisabled,
                      ]}
                    >
                      {s}
                    </Text>
                    {isUserPref && !isSelected && (
                      <View style={styles.prefDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Profile Fit Helper & Stock Status */}
            <View style={styles.sizeStatusRow}>
              {selectedSize && (
                <Text style={styles.sizeStockHint}>
                  {(() => {
                    const v = variations.find((x) => x.size === selectedSize);
                    if (!v) return product.stockStatus === "outofstock" ? "❌ Out of stock" : "✓ In stock · Ready for express delivery";
                    return v.stock === "outofstock" ? "❌ Out of stock in this size" : "✓ In stock · Ready to dispatch";
                  })()}
                </Text>
              )}

              {isSavedMatch && (
                <View style={styles.savedFitPill}>
                  <Sparkles size={11} color={Colors.indigo} />
                  <Text style={styles.savedFitPillText}>Matches Your Fit Profile</Text>
                </View>
              )}
            </View>
          </View>

          {/* Free Gift Promo Tag */}
          <View style={styles.promoTag}>
            <Sparkles size={16} color={Colors.emerald} />
            <Text style={styles.promoTagText}>
              Eligible for <Text style={styles.bold}>FREE Heavyweight Tee</Text> on cart subtotal over ৳3,500.
            </Text>
          </View>

          {/* Accordion Details */}
          {/* Complete the Look Outfit Builder */}
          <CompleteTheLook currentProduct={product} allProducts={allProducts} />

          {/* WhatsApp Stylist Concierge */}
          <WhatsAppConciergeButton
            productName={product.name}
            category={product.category}
          />

          {/* Quick Action Portals: Physical Store Stock, Reviews, Denim Care */}
          <View style={styles.quickFeaturesGrid}>
            <TouchableOpacity
              style={styles.featurePillCard}
              activeOpacity={0.8}
              onPress={() => setStockModalVisible(true)}
            >
              <Store size={15} color={Colors.indigoDark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.featurePillTitle}>OUTLET INVENTORY</Text>
                <Text style={styles.featurePillSub}>Check stock at Banani &amp; Mirpur</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featurePillCard}
              activeOpacity={0.8}
              onPress={() => setReviewsModalVisible(true)}
            >
              <Star size={15} color={Colors.amber} />
              <View style={{ flex: 1 }}>
                <Text style={styles.featurePillTitle}>FIT REVIEWS (4.9 ⭐)</Text>
                <Text style={styles.featurePillSub}>Customer fit photos &amp; feedback</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featurePillCard}
              activeOpacity={0.8}
              onPress={() => setCareGuideVisible(true)}
            >
              <BookOpen size={15} color={Colors.indigoDark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.featurePillTitle}>DENIM CARE GUIDE</Text>
                <Text style={styles.featurePillSub}>First soak &amp; fading handbook</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Accordion Specs & Policy */}
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
                  • Authentic indigo will develop unique personal fades over time
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
                  • Inside Dhaka Standard: ৳50 (2-3 Days){"\n"}
                  • Dhaka Express: ৳120 (Within 24 Hours){"\n"}
                  • Outside Dhaka: ৳90 (Nationwide Courier · 3-5 Days){"\n"}
                  • Store Pickup: FREE (Banani Flagship Studio){"\n"}
                  • 7-Day Hassle-Free Size Exchange Guaranteed
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

      {/* Size Guide Modal */}
      <SizeGuideModal
        visible={sizeGuideVisible}
        onClose={() => setSizeGuideVisible(false)}
        category={product.category}
        selectedSize={selectedSize}
        onSelectSize={handleSizeSelect}
        savedUserSize={savedSizeMatch}
      />

      {/* Fullscreen Image Lightbox Modal */}
      <ImageLightboxModal
        visible={lightboxVisible}
        onClose={() => setLightboxVisible(false)}
        images={galleryImages}
        initialIndex={activeImageIdx}
        productName={product.name}
      />
      {/* Store Stock Modal */}
      {product && (
        <StoreStockModal
          visible={stockModalVisible}
          product={product}
          selectedSize={selectedSize}
          onClose={() => setStockModalVisible(false)}
        />
      )}

      {/* Product Reviews Modal */}
      {product && (
        <ProductReviewsModal
          visible={reviewsModalVisible}
          product={product}
          onClose={() => setReviewsModalVisible(false)}
        />
      )}

      {/* Denim Care Guide Modal */}
      <DenimCareGuideModal
        visible={careGuideVisible}
        onClose={() => setCareGuideVisible(false)}
      />
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
  galleryWrapper: {
    width: width,
    height: IMAGE_HEIGHT,
    backgroundColor: Colors.cardSecondary,
    position: "relative",
  },
  galleryScroll: {
    width: width,
    height: IMAGE_HEIGHT,
  },
  slideItem: {
    width: width,
    height: IMAGE_HEIGHT,
  },
  mainHeroImage: {
    width: width,
    height: IMAGE_HEIGHT,
  },
  imageCounterBadge: {
    position: "absolute",
    top: 14,
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  zoomPill: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  zoomPillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  wishlistBtn: {
    position: "absolute",
    top: 14,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  wishlistBtnActive: {
    backgroundColor: "#FFFFFF",
  },
  dotsRow: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
  },
  dotActive: {
    width: 16,
    backgroundColor: "#FFFFFF",
  },
  thumbStripWrapper: {
    backgroundColor: Colors.paper,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  thumbStrip: {
    gap: 8,
  },
  thumbBtn: {
    width: 56,
    height: 56,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: "hidden",
    backgroundColor: Colors.cardSecondary,
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
  craftBadge: {
    backgroundColor: Colors.amberLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  craftBadgeText: {
    color: Colors.amber,
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
    marginBottom: 10,
  },
  sizeTitleWrap: {
    flex: 1,
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
    marginTop: 2,
  },
  sizeGuideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.indigoLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.indigo,
  },
  sizeGuideBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.indigoDark,
    letterSpacing: 0.5,
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
    position: "relative",
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
  prefDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.indigo,
  },
  sizeStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 6,
  },
  sizeStockHint: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.sub,
  },
  savedFitPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.indigoLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  savedFitPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.indigoDark,
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
  quickFeaturesGrid: {
    gap: 8,
    marginVertical: 8,
  },
  featurePillCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  featurePillTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 0.5,
  },
  featurePillSub: {
    fontSize: 10,
    color: Colors.sub,
    marginTop: 1,
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
