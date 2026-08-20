import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Product } from "../types";
import { Colors } from "../theme/colors";
import { bdt } from "../services/api";

interface ProductCardProps {
  product: Product;
  style?: any;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, style }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/product/[id]",
      params: { id: product.id },
    });
  };

  const hasDiscount = product.salePrice && product.salePrice < product.price;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      activeOpacity={0.88}
      onPress={handlePress}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: product.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />
        {product.isNew && (
          <View style={styles.badgeNew}>
            <Text style={styles.badgeNewText}>NEW</Text>
          </View>
        )}
        {hasDiscount && (
          <View style={styles.badgeSale}>
            <Text style={styles.badgeSaleText}>
              SAVE {bdt(product.price - (product.salePrice || 0))}
            </Text>
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

        <View style={styles.sizePreviewRow}>
          {product.sizes.slice(0, 4).map((s) => (
            <View key={s} style={styles.sizeChip}>
              <Text style={styles.sizeChipText}>{s}</Text>
            </View>
          ))}
          {product.sizes.length > 4 && (
            <Text style={styles.moreSizes}>+{product.sizes.length - 4}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

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
});
