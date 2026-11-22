import React, { useState, useMemo } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Product } from "../types";
import { useTheme } from "../context/ThemeContext";
import { useWishlist } from "../context/WishlistContext";
import { Heart } from "./Icons";
import { bdt, getInStockSizes, decodeHtmlEntities } from "../services/gateway";
import { QuickAddBottomSheet } from "./QuickAddBottomSheet";

interface ProductCardProps {
  product: Product;
  style?: any;
}

function ProductCardBase({ product, style }: ProductCardProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [preselectSize, setPreselectSize] = useState<string>("");

  const isSaved = isInWishlist(product.id);

  const handlePress = () => {
    router.push({
      pathname: "/product/[id]",
      params: { id: product.id },
    });
  };

  const inStockSizes = useMemo(() => getInStockSizes(product), [product]);
  const outOfStock = product.stockStatus === "outofstock" || inStockSizes.length === 0;

  const currentPrice = product.salePrice ?? product.price;
  const origPrice = product.regularPrice && product.regularPrice > currentPrice
    ? product.regularPrice
    : product.salePrice && product.price > product.salePrice
    ? product.price
    : null;
  const hasDiscount = Boolean(origPrice && origPrice > currentPrice);
  const pct = product.salePct ?? (hasDiscount && origPrice ? Math.round(((origPrice - currentPrice) / origPrice) * 100) : 0);

  // Single-Badge Priority: 1. SOLD OUT -> 2. SALE DISCOUNT -> 3. NEW -> 4. SELECT
  const primaryBadge = useMemo(() => {
    if (outOfStock) {
      return { text: "SOLD OUT", bg: colors.ink, color: "#FFFFFF" };
    }
    if (pct > 0) {
      return { text: `-${pct}%`, bg: colors.crimson, color: "#FFFFFF" };
    }
    if (product.isNew) {
      return { text: "NEW", bg: colors.indigo, color: "#FFFFFF" };
    }
    if (product.segment === "select") {
      return { text: "⚡ SELECT", bg: "#1C1917", color: "#D97706" };
    }
    return null;
  }, [outOfStock, pct, product.isNew, product.segment, colors]);

  // Use the Woo thumbnail variant for the grid (fast + correct ratio); fall back
  // to the first gallery/full image if thumb is missing. Never host our own image.
  const imageUri =
    product.thumb ||
    product.images?.[0] ||
    product.gallery?.[0] ||
    "https://images.unsplash.com/photo-1542272604-780c96856592?w=800";

  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
          style,
          outOfStock && styles.cardOOS,
        ]}
        activeOpacity={0.88}
        onPress={handlePress}
        disabled={outOfStock}
      >
        <View style={[styles.imageWrapper, { backgroundColor: colors.cardSecondary }]}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
            fadeDuration={150}
            progressiveRenderingEnabled
            onLoadStart={() => setImgLoaded(false)}
            onLoadEnd={() => setImgLoaded(true)}
          />
          {!imgLoaded && (
            <View style={[styles.imgPlaceholder, { backgroundColor: colors.cardSecondary }]}>
              <ActivityIndicator size="small" color={colors.indigo} />
            </View>
          )}
          {/* Single-Badge Priority: exactly one primary status pill at top-left */}
          {primaryBadge && (
            <View style={[styles.primaryBadge, { backgroundColor: primaryBadge.bg }]}>
              <Text style={[styles.primaryBadgeText, { color: primaryBadge.color }]}>
                {primaryBadge.text}
              </Text>
            </View>
          )}

          {/* Wishlist Heart Button — cleanly isolated at top-right */}
          <TouchableOpacity
            style={[styles.heartBtn, { backgroundColor: isDark ? "rgba(16, 16, 16, 0.85)" : "rgba(255, 255, 255, 0.9)" }]}
            onPress={() => toggleWishlist(product)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          >
            <Heart size={15} color={isSaved ? colors.crimson : colors.ink} />
          </TouchableOpacity>

          {/* Quick Add Overlay Button on the Image */}
          {!outOfStock && (
            <TouchableOpacity
              style={[styles.quickAddBtn, { backgroundColor: colors.indigo }]}
              activeOpacity={0.85}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              onPress={(e) => {
                e.stopPropagation();
                setPreselectSize("");
                setSheetVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Quick add ${product.name} to bag`}
            >
              <Text style={styles.quickAddBtnText}>
                {inStockSizes.length === 1 ? `+ QUICK ADD (${inStockSizes[0]})` : "+ QUICK ADD"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.info}>
          <Text style={[styles.category, { color: colors.sub }]}>
            {product.category}
            {product.brand && product.brand !== "DEEN" ? ` · ${product.brand.toUpperCase()}` : ""}
          </Text>
          <Text style={[styles.name, { color: colors.ink }]} numberOfLines={2}>
            {decodeHtmlEntities(product.name)}
          </Text>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: isDark ? colors.indigo : colors.indigoDark }]}>
              {bdt(currentPrice)}
            </Text>
            {hasDiscount && origPrice && (
              <Text style={[styles.originalPrice, { color: colors.faint }]}>{bdt(origPrice)}</Text>
            )}
          </View>

          {product.rating > 0 && (
            <View style={styles.ratingRow}>
              <Text style={[styles.ratingStar, { color: colors.denimStitch }]}>★</Text>
              <Text style={[styles.ratingText, { color: colors.sub }]}>{product.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Slide-Up Quick Add Bottom Sheet Modal */}
      <QuickAddBottomSheet
        product={product}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        initialSize={preselectSize}
      />
    </>
  );
}

/** Memoized so list re-renders only re-render changed cards (keeps grids snappy). */
export const ProductCard = React.memo(ProductCardBase);

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 3 / 4,
    position: "relative",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imgPlaceholder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 2,
  },
  primaryBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  quickAddBtn: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    height: 34,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  quickAddBtnText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heartBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  cardOOS: {
    opacity: 0.55,
  },
  info: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  category: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 4,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingStar: {
    fontSize: 11,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
