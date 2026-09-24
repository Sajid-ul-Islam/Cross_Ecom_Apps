import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { useProfile } from "../context/ProfileContext";
import { bdt, getInStockSizes, fetchProductById } from "../services/gateway";
import { Product, Variation } from "../types";
import { X, Check, Sparkles, Plus, Minus } from "./Icons";

interface QuickAddBottomSheetProps {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  initialSize?: string;
}

const { width } = Dimensions.get("window");

export const QuickAddBottomSheet: React.FC<QuickAddBottomSheetProps> = ({
  product,
  visible,
  onClose,
  initialSize,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { addToCart } = useCart();
  const { profile } = useProfile();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedVariationId, setSelectedVariationId] = useState<number | undefined>(undefined);
  const [qty, setQty] = useState<number>(1);
  const [addedNotice, setAddedNotice] = useState<boolean>(false);
  const [detailedProduct, setDetailedProduct] = useState<Product | null>(null);
  const [loadingVariations, setLoadingVariations] = useState<boolean>(false);

  const activeProduct = detailedProduct || product;

  // Compute strictly in-stock sizes (filters out any variation with stock === 'outofstock')
  const inStockSizes = useMemo(() => {
    return getInStockSizes(activeProduct);
  }, [activeProduct]);

  const activeVariations = useMemo(() => {
    return activeProduct?.variations || [];
  }, [activeProduct]);

  // Saved fit preference from customer profile
  const savedFitSize = useMemo(() => {
    if (!product) return null;
    const cat = (product.category || "").toUpperCase();
    if (cat.includes("JEAN") || cat.includes("DENIM") || cat.includes("TROUSER")) {
      return profile.jeansSize || null;
    }
    return profile.topSize || null;
  }, [product, profile]);

  useEffect(() => {
    if (!visible || !product) {
      setDetailedProduct(null);
      setSelectedSize("");
      setSelectedVariationId(undefined);
      setQty(1);
      setAddedNotice(false);
      return;
    }

    const available = getInStockSizes(product);
    if (initialSize && available.includes(initialSize)) {
      setSelectedSize(initialSize);
      const v = (product.variations || []).find((x) => x.size === initialSize);
      setSelectedVariationId(v?.id);
    } else if (available.length === 1) {
      setSelectedSize(available[0]);
      const v = (product.variations || []).find((x) => x.size === available[0]);
      setSelectedVariationId(v?.id);
    } else if (savedFitSize && available.includes(savedFitSize)) {
      setSelectedSize(savedFitSize);
      const v = (product.variations || []).find((x) => x.size === savedFitSize);
      setSelectedVariationId(v?.id);
    } else {
      setSelectedSize("");
      setSelectedVariationId(undefined);
    }

    setQty(1);
    setAddedNotice(false);

    // Fetch fresh variations if not present to ensure live stock accuracy
    if (!product.variations || product.variations.length === 0) {
      setLoadingVariations(true);
      fetchProductById(product.id)
        .then((fresh) => {
          if (fresh && fresh.id === product.id) {
            setDetailedProduct(fresh);
            const freshSizes = getInStockSizes(fresh);
            setSelectedSize((prev) => {
              if (prev && freshSizes.includes(prev)) return prev;
              if (freshSizes.length === 1) return freshSizes[0];
              if (savedFitSize && freshSizes.includes(savedFitSize)) return savedFitSize;
              return "";
            });
          }
        })
        .catch(() => {})
        .finally(() => setLoadingVariations(false));
    }
  }, [visible, product, initialSize, savedFitSize]);

  if (!visible || !product) return null;

  const currentPrice = product.salePrice ?? product.price;
  const origPrice =
    product.regularPrice && product.regularPrice > currentPrice
      ? product.regularPrice
      : product.salePrice && product.price > product.salePrice
      ? product.price
      : null;
  const hasDiscount = Boolean(origPrice && origPrice > currentPrice);
  const pct =
    product.salePct ??
    (hasDiscount && origPrice
      ? Math.round(((origPrice - currentPrice) / origPrice) * 100)
      : 0);

  const isOOS = product.stockStatus === "outofstock" || inStockSizes.length === 0;
  const imageUri =
    product.thumb ||
    product.images?.[0] ||
    product.gallery?.[0] ||
    "https://images.unsplash.com/photo-1542272604-780c96856592?w=800";

  const handleSelectSize = (s: string) => {
    setSelectedSize(s);
    const v = activeVariations.find((x) => x.size === s);
    setSelectedVariationId(v?.id);
  };

  const handleAddToCart = () => {
    if (!selectedSize || isOOS || addedNotice) return;
    addToCart(product, selectedSize, qty, selectedVariationId);
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 750);
  };

  const handleNavigatePDP = () => {
    onClose();
    router.push({
      pathname: "/product/[id]",
      params: { id: product.id },
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.sheetContainer,
                { backgroundColor: colors.paper, borderColor: colors.border },
              ]}
            >
              {/* Drag Handle */}
              <View
                style={[styles.dragHandle, { backgroundColor: colors.borderLight }]}
              />

              {/* Close Button */}
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: colors.cardSecondary }]}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Close quick add"
              >
                <X size={18} color={colors.ink} />
              </TouchableOpacity>

              {/* Product Header Row */}
              <View style={styles.productRow}>
                <Image
                  source={{ uri: imageUri }}
                  style={[styles.productThumb, { backgroundColor: colors.cardSecondary }]}
                  resizeMode="cover"
                />

                <View style={styles.productDetails}>
                  <View style={styles.categoryRow}>
                    <Text style={[styles.categoryText, { color: colors.sub }]}>
                      {product.category}
                    </Text>
                    {product.brand && product.brand !== "DEEN" && (
                      <View style={[styles.brandBadge, { backgroundColor: colors.indigoLight }]}>
                        <Text style={[styles.brandBadgeText, { color: colors.indigo }]}>
                          {product.brand.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={[styles.productName, { color: colors.ink }]}
                    numberOfLines={2}
                  >
                    {product.name}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: isDark ? colors.indigo : colors.indigoDark }]}>
                      {bdt(currentPrice)}
                    </Text>
                    {hasDiscount && origPrice && (
                      <Text style={[styles.originalPrice, { color: colors.faint }]}>
                        {bdt(origPrice)}
                      </Text>
                    )}
                    {pct > 0 && (
                      <View style={[styles.saleBadge, { backgroundColor: colors.crimson }]}>
                        <Text style={styles.saleBadgeText}>-{pct}%</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

              {/* Size Selector Section */}
              <View style={styles.sizeSection}>
                <View style={styles.sizeSectionHeader}>
                  <Text style={[styles.sizeSectionTitle, { color: colors.ink }]}>
                    SELECT SIZE {selectedSize ? `· ${selectedSize}` : ""}
                  </Text>
                  <Text style={[styles.sizeCountText, { color: colors.sub }]}>
                    {isOOS
                      ? "Out of Stock"
                      : `${inStockSizes.length} size${inStockSizes.length > 1 ? "s" : ""} available`}
                  </Text>
                </View>

                {isOOS ? (
                  <View style={[styles.oosBox, { backgroundColor: colors.cardSecondary }]}>
                    <Text style={[styles.oosText, { color: colors.sub }]}>
                      ⚠️ Currently out of stock in all sizes.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.sizeGrid}>
                    {inStockSizes.map((s) => {
                      const isSelected = selectedSize === s;
                      const isFitMatch = s === savedFitSize;

                      return (
                        <TouchableOpacity
                          key={s}
                          style={[
                            styles.sizeChip,
                            {
                              backgroundColor: isSelected ? colors.indigo : colors.cardSecondary,
                              borderColor: isSelected ? colors.indigo : colors.border,
                            },
                          ]}
                          activeOpacity={0.8}
                          onPress={() => handleSelectSize(s)}
                          accessibilityRole="button"
                          accessibilityLabel={`Size ${s}${isSelected ? ", selected" : ""}`}
                        >
                          <Text
                            style={[
                              styles.sizeChipText,
                              { color: isSelected ? "#FFFFFF" : colors.ink },
                            ]}
                          >
                            {s}
                          </Text>
                          {isFitMatch && !isSelected && (
                            <View style={[styles.fitDot, { backgroundColor: colors.indigo }]} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {loadingVariations && (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={colors.indigo} />
                    <Text style={[styles.loadingText, { color: colors.sub }]}>
                      Checking real-time stock…
                    </Text>
                  </View>
                )}

                {savedFitSize && inStockSizes.includes(savedFitSize) && (
                  <View style={styles.fitMatchHint}>
                    <Sparkles size={12} color={colors.indigo} />
                    <Text style={[styles.fitMatchHintText, { color: colors.indigo }]}>
                      Size {savedFitSize} matches your fit preference
                    </Text>
                  </View>
                )}
              </View>

              {/* Quantity Stepper */}
              {!isOOS && (
                <View
                  style={[
                    styles.qtyRow,
                    { backgroundColor: colors.cardSecondary, borderColor: colors.borderLight },
                  ]}
                >
                  <Text style={[styles.qtyLabel, { color: colors.ink }]}>QUANTITY</Text>
                  <View style={styles.qtyStepper}>
                    <TouchableOpacity
                      style={[
                        styles.qtyBtn,
                        { borderColor: colors.border, backgroundColor: colors.paper },
                        qty <= 1 && styles.qtyBtnDisabled,
                      ]}
                      onPress={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel="Decrease quantity"
                    >
                      <Minus size={14} color={qty <= 1 ? colors.faint : colors.ink} />
                    </TouchableOpacity>

                    <Text style={[styles.qtyVal, { color: colors.ink }]}>{qty}</Text>

                    <TouchableOpacity
                      style={[
                        styles.qtyBtn,
                        { borderColor: colors.border, backgroundColor: colors.paper },
                        qty >= 10 && styles.qtyBtnDisabled,
                      ]}
                      onPress={() => setQty((q) => Math.min(10, q + 1))}
                      disabled={qty >= 10}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel="Increase quantity"
                    >
                      <Plus size={14} color={qty >= 10 ? colors.faint : colors.ink} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Primary CTA Button */}
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  {
                    backgroundColor: addedNotice
                      ? colors.emerald
                      : !selectedSize || isOOS
                      ? colors.cardSecondary
                      : colors.indigo,
                  },
                ]}
                activeOpacity={0.88}
                disabled={!selectedSize || isOOS || addedNotice}
                onPress={handleAddToCart}
                accessibilityRole="button"
                accessibilityLabel="Add to bag"
              >
                {addedNotice ? (
                  <View style={styles.ctaContentRow}>
                    <Check size={18} color="#FFFFFF" />
                    <Text style={styles.ctaTextSuccess}>
                      ADDED (SIZE {selectedSize})
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.ctaText,
                      {
                        color:
                          !selectedSize || isOOS ? colors.sub : "#FFFFFF",
                      },
                    ]}
                  >
                    {isOOS
                      ? "OUT OF STOCK"
                      : !selectedSize
                      ? "SELECT A SIZE TO ADD"
                      : `ADD TO BAG · ${bdt(currentPrice * qty)}`}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Link to Full PDP */}
              <TouchableOpacity
                style={styles.pdpLinkBtn}
                onPress={handleNavigatePDP}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="View full product details"
              >
                <Text style={[styles.pdpLinkText, { color: colors.sub }]}>
                  View Full Product Specifications →
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  productRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  productThumb: {
    width: 72,
    height: 92,
    borderRadius: 8,
  },
  productDetails: {
    flex: 1,
    paddingRight: 30,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  brandBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  brandBadgeText: {
    fontSize: 9.5,
    fontWeight: "900",
  },
  productName: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "900",
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  saleBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  saleBadgeText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "900",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  sizeSection: {
    marginBottom: 16,
  },
  sizeSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sizeSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sizeCountText: {
    fontSize: 11,
    fontWeight: "600",
  },
  sizeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sizeChip: {
    minWidth: 52,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  sizeChipText: {
    fontSize: 13,
    fontWeight: "800",
  },
  fitDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  loadingText: {
    fontSize: 11,
  },
  fitMatchHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  fitMatchHintText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  oosBox: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  oosText: {
    fontSize: 12,
    fontWeight: "600",
  },
  qtyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  qtyLabel: {
    fontSize: 12,
    fontWeight: "800",
  },
  qtyStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnDisabled: {
    opacity: 0.35,
  },
  qtyVal: {
    fontSize: 14,
    fontWeight: "900",
    minWidth: 20,
    textAlign: "center",
  },
  ctaButton: {
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  ctaContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  ctaTextSuccess: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  pdpLinkBtn: {
    alignSelf: "center",
    paddingVertical: 4,
  },
  pdpLinkText: {
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
