import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Sparkles, ShoppingBag, Plus, Check, ArrowRight, Tag } from "./Icons";
import { Colors } from "../theme/colors";
import { useCart } from "../context/CartContext";
import { Product } from "../types";
import { bdt } from "../services/gateway";

const { width } = Dimensions.get("window");

interface CompleteTheLookProps {
  currentProduct: Product;
  allProducts: Product[];
}

export const CompleteTheLook: React.FC<CompleteTheLookProps> = ({
  currentProduct,
  allProducts,
}) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  // Find 2 matching items from complementary categories
  const complementaryCategories = (() => {
    switch (currentProduct.category) {
      case "JEANS":
        return ["T-SHIRT", "SHIRT", "POLO"];
      case "PANJABI":
        return ["TROUSERS", "ACCESSORIES", "SHIRT"];
      case "SHIRT":
      case "T-SHIRT":
      case "POLO":
        return ["JEANS", "TROUSERS", "ACCESSORIES"];
      default:
        return ["JEANS", "T-SHIRT", "SHIRT"];
    }
  })();

  const matchingItems = allProducts
    .filter(
      (p) =>
        p.id !== currentProduct.id &&
        complementaryCategories.includes(p.category) &&
        p.stockStatus === "instock"
    )
    .slice(0, 2);

  if (matchingItems.length === 0) return null;

  const fullLook = [currentProduct, ...matchingItems];
  const regularTotal = fullLook.reduce((s, p) => s + (p.salePrice ?? p.price), 0);
  const bundleDiscount = Math.round(regularTotal * 0.1); // 10% Bundle Discount
  const bundleTotal = regularTotal - bundleDiscount;

  const handleAddFullLook = () => {
    fullLook.forEach((item) => {
      const size = item.sizes?.[0] || "FREE";
      addToCart(item, size, 1);
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.badgePill}>
            <Sparkles size={12} color="#FFFFFF" />
            <Text style={styles.badgePillText}>STYLIST CURATION</Text>
          </View>
          <Text style={styles.title}>COMPLETE THE LOOK</Text>
        </View>

        <View style={styles.savingsPill}>
          <Tag size={11} color={Colors.emerald} />
          <Text style={styles.savingsPillText}>SAVE 10% BUNDLE</Text>
        </View>
      </View>

      <Text style={styles.sub}>
        Curated menswear pairing by DEEN Dhaka stylists. Buy the full outfit & save 10%.
      </Text>

      {/* Outfit Thumbnails Row */}
      <View style={styles.outfitRow}>
        {fullLook.map((item, idx) => (
          <React.Fragment key={item.id}>
            <TouchableOpacity
              style={styles.itemCard}
              activeOpacity={0.85}
              onPress={() => router.push(`/product/${item.id}` as any)}
            >
              <Image source={{ uri: item.images[0] }} style={styles.itemImage} resizeMode="cover" />
              <View style={styles.itemOverlay}>
                <Text style={styles.itemCat}>{item.category}</Text>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemPrice}>{bdt(item.salePrice ?? item.price)}</Text>
              </View>
            </TouchableOpacity>

            {idx < fullLook.length - 1 && (
              <View style={styles.plusIconWrapper}>
                <Plus size={14} color={Colors.indigo} />
              </View>
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Pricing and Action Button */}
      <View style={styles.pricingCard}>
        <View style={styles.priceBreakdown}>
          <View>
            <Text style={styles.totalLabel}>TOTAL 3-PIECE OUTFIT</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
              <Text style={styles.bundlePrice}>{bdt(bundleTotal)}</Text>
              <Text style={styles.strikePrice}>{bdt(regularTotal)}</Text>
            </View>
          </View>
          <Text style={styles.savingsAmount}>Save {bdt(bundleDiscount)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.addBundleBtn, added && styles.addBundleBtnSuccess]}
          activeOpacity={0.88}
          onPress={handleAddFullLook}
        >
          {added ? (
            <>
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.addBundleBtnText}>ADDED 3 ITEMS TO BAG</Text>
            </>
          ) : (
            <>
              <ShoppingBag size={16} color="#FFFFFF" />
              <Text style={styles.addBundleBtnText}>ADD COMPLETE LOOK TO BAG (SAVE 10%)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  headerLeft: {
    gap: 4,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.indigo,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: "flex-start",
  },
  badgePillText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 0.6,
  },
  savingsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.emerald,
  },
  savingsPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.emerald,
    letterSpacing: 0.4,
  },
  sub: {
    fontSize: 11,
    color: Colors.sub,
    lineHeight: 16,
    marginBottom: 12,
  },
  outfitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 14,
  },
  itemCard: {
    flex: 1,
    height: 130,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10, 20, 15, 0.75)",
    padding: 6,
  },
  itemCat: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  itemName: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  itemPrice: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 2,
  },
  plusIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.indigoLight,
    alignItems: "center",
    justifyContent: "center",
  },
  pricingCard: {
    backgroundColor: Colors.paper,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  priceBreakdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.sub,
    letterSpacing: 0.5,
  },
  bundlePrice: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.indigoDark,
  },
  strikePrice: {
    fontSize: 12,
    color: Colors.sub,
    textDecorationLine: "line-through",
  },
  savingsAmount: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.emerald,
  },
  addBundleBtn: {
    backgroundColor: Colors.indigo,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 6,
  },
  addBundleBtnSuccess: {
    backgroundColor: Colors.emerald,
  },
  addBundleBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
});
