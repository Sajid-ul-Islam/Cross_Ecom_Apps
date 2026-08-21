import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Product } from "../types";
import { Colors } from "../theme/colors";
import { bdt } from "../services/gateway";

interface ProductCardProps {
  product: Product;
  style?: any;
}

function ProductCardBase({ product, style }: ProductCardProps) {
  const router = useRouter();
  const [imgLoaded, setImgLoaded] = React.useState(false);

  const handlePress = () => {
    router.push({
      pathname: "/product/[id]",
      params: { id: product.id },
    });
  };

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const pct = product.salePct ?? (hasDiscount ? Math.round(((product.price - (product.salePrice || 0)) / product.price) * 100) : 0);
  const outOfStock = product.stockStatus === "outofstock";
  const imageUri = product.images?.[0] || product.gallery?.[0] || "https://images.unsplash.com/photo-1542272604-780c96856592?w=800";
  const displaySizes = product.sizes || [];

  return (
    <TouchableOpacity
      style={[styles.card, style, outOfStock && styles.cardOOS]}
      activeOpacity={0.88}
      onPress={handlePress}
      disabled={outOfStock}
    >
      <View style={styles.imageWrapper}>
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
          <View style={styles.imgPlaceholder}>
            <ActivityIndicator size="small" color={Colors.indigo} />
          </View>
        )}
        {product.isNew && (
          <View style={styles.badgeNew}>
            <Text style={styles.badgeNewText}>NEW</Text>
          </View>
        )}
        {pct > 0 && (
          <View style={styles.badgeSale}>
            <Text style={styles.badgeSaleText}>-{pct}%</Text>
          </View>
        )}
        {outOfStock && (
          <View style={styles.badgeOOS}>
            <Text style={styles.badgeOOSText}>SOLD OUT</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {bdt(product.salePrice ?? product.price)}
          </Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>{bdt(product.price)}</Text>
          )}
        </View>

        {product.rating > 0 && (
          <View style={styles.ratingRow}>
            <Text style={styles.ratingStar}>★</Text>
            <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
          </View>
        )}

        <View style={styles.sizePreviewRow}>
          {displaySizes.slice(0, 4).map((s) => (
            <View key={s} style={styles.sizeChip}>
              <Text style={styles.sizeChipText}>{s}</Text>
            </View>
          ))}
          {displaySizes.length > 4 && (
            <Text style={styles.moreSizes}>+{displaySizes.length - 4}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

/** Memoized so list re-renders only re-render changed cards (keeps grids snappy). */
export const ProductCard = React.memo(ProductCardBase);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: 12,
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 0.9,
    backgroundColor: Colors.cardSecondary,
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
    backgroundColor: Colors.cardSecondary,
  },
  badgeNew: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.indigo,
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
    backgroundColor: Colors.crimson,
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
    backgroundColor: Colors.ink,
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
  cardOOS: {
    opacity: 0.55,
  },
  info: {
    padding: 10,
  },
  category: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.sub,
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.ink,
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
    color: Colors.indigoDark,
  },
  originalPrice: {
    fontSize: 12,
    color: Colors.faint,
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
    backgroundColor: Colors.paper,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sizeChipText: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.sub,
  },
  moreSizes: {
    fontSize: 9,
    color: Colors.faint,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 6,
  },
  ratingStar: {
    fontSize: 11,
    color: Colors.denimStitch,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.sub,
  },
});
