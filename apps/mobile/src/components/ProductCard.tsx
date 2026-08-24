import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Product } from "../types";
import { useTheme } from "../context/ThemeContext";
import { useWishlist } from "../context/WishlistContext";
import { Heart } from "./Icons";
import { bdt } from "../services/gateway";

interface ProductCardProps {
  product: Product;
  style?: any;
}

function ProductCardBase({ product, style }: ProductCardProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [imgLoaded, setImgLoaded] = React.useState(false);

  const isSaved = isInWishlist(product.id);

  const handlePress = () => {
    router.push({
      pathname: "/product/[id]",
      params: { id: product.id },
    });
  };

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const pct = product.salePct ?? (hasDiscount ? Math.round(((product.price - (product.salePrice || 0)) / product.price) * 100) : 0);
  const outOfStock = product.stockStatus === "outofstock";
  // Use the Woo thumbnail variant for the grid (fast + correct ratio); fall back
  // to the first gallery/full image if thumb is missing. Never host our own image.
  const imageUri =
    product.thumb ||
    product.images?.[0] ||
    product.gallery?.[0] ||
    "https://images.unsplash.com/photo-1542272604-780c96856592?w=800";
  const displaySizes = product.sizes || [];

  return (
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
        {product.isNew && (
          <View style={[styles.badgeNew, { backgroundColor: colors.indigo }]}>
            <Text style={styles.badgeNewText}>NEW</Text>
          </View>
        )}
        {pct > 0 && (
          <View style={[styles.badgeSale, { backgroundColor: colors.crimson }]}>
            <Text style={styles.badgeSaleText}>-{pct}%</Text>
          </View>
        )}
        {outOfStock && (
          <View style={[styles.badgeOOS, { backgroundColor: colors.ink }]}>
            <Text style={styles.badgeOOSText}>SOLD OUT</Text>
          </View>
        )}

        {/* Wishlist Heart Button */}
        <TouchableOpacity
          style={[styles.heartBtn, { backgroundColor: isDark ? "rgba(13, 17, 26, 0.85)" : "rgba(255, 255, 255, 0.85)" }]}
          onPress={() => toggleWishlist(product)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Heart size={14} color={isSaved ? colors.crimson : colors.ink} />
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={[styles.category, { color: colors.sub }]}>{product.category}</Text>
        <Text style={[styles.name, { color: colors.ink }]} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: isDark ? colors.indigo : colors.indigoDark }]}>
            {bdt(product.salePrice ?? product.price)}
          </Text>
          {hasDiscount && (
            <Text style={[styles.originalPrice, { color: colors.faint }]}>{bdt(product.price)}</Text>
          )}
        </View>

        {product.rating > 0 && (
          <View style={styles.ratingRow}>
            <Text style={[styles.ratingStar, { color: colors.denimStitch }]}>★</Text>
            <Text style={[styles.ratingText, { color: colors.sub }]}>{product.rating.toFixed(1)}</Text>
          </View>
        )}

        <View style={styles.sizePreviewRow}>
          {displaySizes.slice(0, 4).map((s) => (
            <View key={s} style={[styles.sizeChip, { backgroundColor: colors.paper, borderColor: colors.borderLight }]}>
              <Text style={[styles.sizeChipText, { color: colors.sub }]}>{s}</Text>
            </View>
          ))}
          {displaySizes.length > 4 && (
            <Text style={[styles.moreSizes, { color: colors.faint }]}>+{displaySizes.length - 4}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/** Memoized so list re-renders only re-render changed cards (keeps grids snappy). */
export const ProductCard = React.memo(ProductCardBase);

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 0.9,
    position: "relative",
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
  badgeNew: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeNewText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  badgeSale: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeSaleText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  badgeOOS: {
    position: "absolute",
    bottom: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeOOSText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heartBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardOOS: {
    opacity: 0.55,
  },
  info: {
    padding: 10,
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
    marginBottom: 6,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  sizePreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sizeChip: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
  },
  sizeChipText: {
    fontSize: 9,
    fontWeight: "600",
  },
  moreSizes: {
    fontSize: 9,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 6,
  },
  ratingStar: {
    fontSize: 11,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
