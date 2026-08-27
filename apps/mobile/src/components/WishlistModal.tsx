import React from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { X, Heart, ShoppingBag, Trash2, ArrowRight, Check } from "./Icons";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { bdt } from "../services/gateway";
import { Product } from "../types";

const { width, height } = Dimensions.get("window");

interface WishlistModalProps {
  visible: boolean;
  onClose: () => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const styles = createStyles(colors);

  const handleMoveToBag = (product: Product) => {
    const selectedSize = product.sizes?.[0] || "FREE";
    addToCart(product, selectedSize, 1);
    removeFromWishlist(product.id);
  };

  const handleMoveAllToBag = () => {
    if (wishlist.length === 0) return;
    wishlist.forEach((p) => {
      const selectedSize = p.sizes?.[0] || "FREE";
      addToCart(p, selectedSize, 1);
    });
    clearWishlist();
    onClose();
    router.push("/(tabs)/cart");
  };

  const handleItemPress = (productId: string) => {
    onClose();
    router.push(`/product/${productId}` as any);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.crimsonLight }]}>
                <Heart size={18} color={colors.crimson} />
              </View>
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[styles.title, { color: colors.ink }]}>SAVED ITEMS</Text>
                  <View style={[styles.countBadge, { backgroundColor: colors.indigo }]}>
                    <Text style={styles.countBadgeText}>{wishlist.length}</Text>
                  </View>
                </View>
                <Text style={[styles.subtitle, { color: colors.sub }]}>Watchlist with automatic price-drop alerts</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.cardSecondary }]} onPress={onClose}>
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          {/* Items Content */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {wishlist.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Heart size={36} color={colors.faint} />
                </View>
                <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
                <Text style={styles.emptySub}>
                  Tap the heart icon on any raw selvedge denim or heavyweight tee to save it here for later.
                </Text>
                <TouchableOpacity
                  style={styles.shopBtn}
                  onPress={() => {
                    onClose();
                    router.push("/(tabs)/shop");
                  }}
                >
                  <Text style={styles.shopBtnText}>BROWSE MENSWEAR</Text>
                  <ArrowRight size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.actionsBar}>
                  <Text style={styles.itemsCountText}>{wishlist.length} ITEMS SAVED</Text>
                  <TouchableOpacity style={styles.moveAllBtn} onPress={handleMoveAllToBag}>
                    <ShoppingBag size={13} color={colors.indigo} />
                    <Text style={styles.moveAllText}>MOVE ALL TO BAG</Text>
                  </TouchableOpacity>
                </View>

                {wishlist.map((item) => {
                  const unit = item.salePrice ?? item.price;
                  return (
                    <View key={item.id} style={styles.itemCard}>
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
                          <View style={styles.saleBadge}>
                            <Text style={styles.saleBadgeText}>-{item.salePct}%</Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>

                      <View style={styles.itemDetails}>
                        <TouchableOpacity onPress={() => handleItemPress(item.id)}>
                          <Text style={styles.itemCategory}>{item.category}</Text>
                          <Text style={styles.itemName} numberOfLines={2}>
                            {item.name}
                          </Text>
                        </TouchableOpacity>

                        <View style={styles.priceRow}>
                          <Text style={styles.priceCurrent}>{bdt(unit)}</Text>
                          {item.regularPrice && item.regularPrice > unit && (
                            <Text style={styles.priceRegular}>{bdt(item.regularPrice)}</Text>
                          )}
                        </View>

                        <View style={styles.cardActions}>
                          <TouchableOpacity
                            style={styles.addToBagBtn}
                            activeOpacity={0.8}
                            onPress={() => handleMoveToBag(item)}
                          >
                            <ShoppingBag size={12} color="#FFFFFF" />
                            <Text style={styles.addToBagBtnText}>ADD TO BAG</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.removeBtn}
                            onPress={() => removeFromWishlist(item.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Trash2 size={15} color={colors.sub} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: colors.paper,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: height * 0.88,
      paddingTop: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.crimsonLight,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 14,
      fontWeight: "900",
      color: colors.ink,
      letterSpacing: 0.8,
    },
    countBadge: {
      backgroundColor: colors.indigo,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 10,
    },
    countBadgeText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "900",
    },
    subtitle: {
      fontSize: 11,
      color: colors.sub,
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.cardSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      padding: 16,
      gap: 12,
      paddingBottom: 36,
    },
    actionsBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    itemsCountText: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.sub,
      letterSpacing: 0.6,
    },
    moveAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.indigoLight,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 5,
    },
    moveAllText: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.indigoDark,
    },
    itemCard: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 10,
      gap: 12,
    },
    itemImgWrapper: {
      width: 84,
      height: 105,
      borderRadius: 6,
      overflow: "hidden",
      backgroundColor: colors.paper,
      position: "relative",
    },
    itemImg: {
      width: "100%",
      height: "100%",
    },
    saleBadge: {
      position: "absolute",
      top: 4,
      left: 4,
      backgroundColor: colors.crimson,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 3,
    },
    saleBadgeText: {
      color: "#FFFFFF",
      fontSize: 8,
      fontWeight: "900",
    },
    itemDetails: {
      flex: 1,
      justifyContent: "space-between",
    },
    itemCategory: {
      fontSize: 8,
      fontWeight: "800",
      color: colors.sub,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    itemName: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.ink,
      lineHeight: 16,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginVertical: 4,
    },
    priceCurrent: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.indigoDark,
    },
    priceRegular: {
      fontSize: 11,
      color: colors.sub,
      textDecorationLine: "line-through",
    },
    cardActions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    addToBagBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: colors.indigo,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 5,
    },
    addToBagBtnText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    removeBtn: {
      padding: 6,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 48,
      gap: 10,
    },
    emptyIconCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.cardSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.ink,
    },
    emptySub: {
      fontSize: 12,
      color: colors.sub,
      textAlign: "center",
      maxWidth: 260,
      lineHeight: 18,
    },
    shopBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.indigo,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 6,
      marginTop: 6,
    },
    shopBtnText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
  });
}
