import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter } from "expo-router";

import { Heart, ShoppingBag, Trash2, ArrowRight } from "../src/components/Icons";
import { ScreenShell } from "../src/components/ScreenShell";
import { useTheme } from "../src/context/ThemeContext";
import { useWishlist } from "../src/context/WishlistContext";
import { useCart } from "../src/context/CartContext";
import { bdt, getInStockSizes, decodeHtmlEntities } from "../src/services/gateway";
import { Product } from "../src/types";
import { QuickAddBottomSheet } from "../src/components/QuickAddBottomSheet";
import { ThemeColors } from "../src/theme/colors";
import { sharedStyles } from "../src/theme/sharedStyles";

export default function WishlistScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const s = sharedStyles(colors);
  const styles = createStyles(colors, s);
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);
  const [quickAddVisible, setQuickAddVisible] = useState(false);

  const handleMoveToBag = (product: Product) => {
    const inStock = getInStockSizes(product);
    if (inStock.length === 1) {
      addToCart(product, inStock[0], 1);
      removeFromWishlist(product.id);
      return;
    }
    setQuickAddProduct(product);
    setQuickAddVisible(true);
  };

  const handleMoveAllToBag = () => {
    if (wishlist.length === 0) return;
    wishlist.forEach((p) => {
      const selectedSize = p.sizes?.[0] || "FREE";
      addToCart(p, selectedSize, 1);
    });
    clearWishlist();
    router.push("/(tabs)/cart");
  };

  const handleItemPress = (productId: string) => {
    router.push(`/product/${productId}` as any);
  };

  return (
    <ScreenShell title="SAVED ITEMS" showSearch={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {wishlist.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.crimsonLight }]}>
              <Heart size={36} color={colors.crimson} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>Your Wishlist is Empty</Text>
            <Text style={[styles.emptySub, { color: colors.sub }]}>
              Tap the heart icon on any raw selvedge denim or artisanal shirt to save it here for later.
            </Text>
            <TouchableOpacity
              style={[styles.shopBtn, { backgroundColor: colors.indigo }]}
              activeOpacity={0.85}
              onPress={() => router.push("/(tabs)/shop")}
            >
              <Text style={styles.shopBtnText}>BROWSE CATALOG</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <View style={[styles.actionsBar, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.itemsCountText, { color: colors.sub }]}>
                {wishlist.length} {wishlist.length === 1 ? "ITEM" : "ITEMS"} SAVED
              </Text>
              <TouchableOpacity
                style={[styles.moveAllBtn, { backgroundColor: colors.indigoLight }]}
                activeOpacity={0.8}
                onPress={handleMoveAllToBag}
              >
                <ShoppingBag size={13} color={colors.indigo} />
                <Text style={[styles.moveAllText, { color: colors.indigo }]}>MOVE ALL TO BAG</Text>
              </TouchableOpacity>
            </View>

            {wishlist.map((item) => {
              const unit = item.salePrice ?? item.price;
              return (
                <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleItemPress(item.id)}
                    style={styles.itemImgWrapper}
                  >
                    <Image
                      source={{ uri: item.images[0] }}
                      style={styles.itemImg}
                      resizeMode="cover"
                    />
                    {item.salePct && item.salePct > 0 ? (
                      <View style={[styles.saleBadge, { backgroundColor: colors.crimson }]}>
                        <Text style={styles.saleBadgeText}>-{item.salePct}%</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>

                  <View style={styles.itemDetails}>
                    <TouchableOpacity onPress={() => handleItemPress(item.id)}>
                      <Text style={[styles.itemCategory, { color: colors.indigo }]}>{item.category}</Text>
                      <Text style={[styles.itemName, { color: colors.ink }]} numberOfLines={2}>
                        {decodeHtmlEntities(item.name)}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.priceRow}>
                      <Text style={[styles.priceCurrent, { color: colors.ink }]}>{bdt(unit)}</Text>
                      {item.regularPrice && item.regularPrice > unit && (
                        <Text style={[styles.priceRegular, { color: colors.faint }]}>{bdt(item.regularPrice)}</Text>
                      )}
                    </View>

                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={[styles.moveToBagBtn, { backgroundColor: colors.indigo }]}
                        activeOpacity={0.85}
                        onPress={() => handleMoveToBag(item)}
                      >
                        <ShoppingBag size={12} color="#FFFFFF" />
                        <Text style={styles.moveToBagText}>MOVE TO BAG</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.deleteBtn, { borderColor: colors.borderLight }]}
                        onPress={() => removeFromWishlist(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${item.name} from saved items`}
                      >
                        <Trash2 size={15} color={colors.sub} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <QuickAddBottomSheet
        product={quickAddProduct}
        visible={quickAddVisible}
        onClose={() => setQuickAddVisible(false)}
      />
    </ScreenShell>
  );
}

function createStyles(colors: ThemeColors, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      paddingHorizontal: 20,
    },
    emptyIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "900",
      marginBottom: 8,
    },
    emptySub: {
      fontSize: 13,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 20,
      maxWidth: 280,
    },
    shopBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    shopBtnText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    listContainer: {
      gap: 12,
    },
    actionsBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 12,
      borderBottomWidth: 1,
      marginBottom: 4,
    },
    itemsCountText: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    moveAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
    },
    moveAllText: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    itemCard: {
      flexDirection: "row",
      borderRadius: 12,
      borderWidth: 1,
      padding: 10,
      gap: 12,
    },
    itemImgWrapper: {
      position: "relative",
      width: 90,
      height: 105,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: colors.cardSecondary,
    },
    itemImg: {
      width: "100%",
      height: "100%",
    },
    saleBadge: {
      position: "absolute",
      top: 5,
      left: 5,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
    },
    saleBadgeText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "900",
    },
    itemDetails: {
      flex: 1,
      justifyContent: "space-between",
    },
    itemCategory: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    itemName: {
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 17,
      marginBottom: 4,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 6,
      marginBottom: 8,
    },
    priceCurrent: {
      fontSize: 14,
      fontWeight: "900",
    },
    priceRegular: {
      fontSize: 12,
      textDecorationLine: "line-through",
    },
    itemActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    moveToBagBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 8,
      borderRadius: 6,
    },
    moveToBagText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.4,
    },
    deleteBtn: {
      width: 32,
      height: 32,
      borderRadius: 6,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
