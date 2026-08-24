import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ShoppingBag,
  SlidersHorizontal,
  Ruler,
  Sparkles,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  Layers,
} from "../../src/components/Icons";
import { Colors } from "../../src/theme/colors";
import { useTheme } from "../../src/context/ThemeContext";
import { ProductCard } from "../../src/components/ProductCard";
import { SizeGuideModal } from "../../src/components/SizeGuideModal";
import { fetchProducts, isGatewayConfigured, useCatalogRefreshOnFocus, fetchCategoryCovers } from "../../src/services/gateway";
import { Product, DeenCategory } from "../../src/types";
import { useCart } from "../../src/context/CartContext";
import { useProfile } from "../../src/context/ProfileContext";
import { getCategoryInfo } from "../../src/data/categories";

const { width } = Dimensions.get("window");
const COVER_HEIGHT = 220;

type SortOption = "featured" | "price_asc" | "price_desc" | "newest" | "discount";

export default function CategoryLandingScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { totalItems } = useCart();
  const { profile } = useProfile();

  const categoryInfo = useMemo(() => getCategoryInfo(slug || "JEANS"), [slug]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTag, setSelectedTag] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [sizeGuideVisible, setSizeGuideVisible] = useState(false);
  const [categoryCovers, setCategoryCovers] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCategoryCovers()
      .then((c) => setCategoryCovers(c || {}))
      .catch(() => {});
  }, []);

  const loadCategoryProducts = async () => {
    try {
      const all = await fetchProducts();
      const targetCat = categoryInfo.name;
      const filtered = all.filter((p) => {
        if (!targetCat || targetCat === "ALL") return true;
        return p.category.toUpperCase() === targetCat.toUpperCase();
      });
      setProducts(filtered);
    } catch (e) {
      console.error("Failed to load category products", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh catalog whenever this category screen regains focus or the app
  // resumes from background — surfaces live WooCommerce stock/product changes.
  useCatalogRefreshOnFocus(loadCategoryProducts);

  useEffect(() => {
    setLoading(true);
    loadCategoryProducts();
  }, [slug]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCategoryProducts();
  };

  // Filter and Sort items
  const displayedProducts = useMemo(() => {
    let list = [...products];

    // Tag filter
    if (selectedTag && selectedTag !== "All") {
      const q = selectedTag.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q) ||
          p.blurb?.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case "price_asc":
        list.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
        break;
      case "price_desc":
        list.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
        break;
      case "newest":
        list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case "discount":
        list.sort((a, b) => (b.salePct || 0) - (a.salePct || 0));
        break;
      default:
        break;
    }

    return list;
  }, [products, selectedTag, sortBy]);

  const savedSizeMatch =
    categoryInfo.name === "JEANS"
      ? profile.jeansSize
      : profile.topSize;

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

        <View style={styles.navTitleCenter}>
          <Text style={[styles.navTitle, { color: colors.ink }]} numberOfLines={1}>
            {categoryInfo.title}
          </Text>
          <Text style={[styles.navSub, { color: colors.sub }]}>
            {products.length} {products.length === 1 ? "Item" : "Items"} in Collection
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.bagBtn, { backgroundColor: colors.cardSecondary }]}
          onPress={() => router.push("/(tabs)/cart")}
        >
          <ShoppingBag size={20} color={colors.ink} />
          {totalItems > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.indigo }]}>
              <Text style={styles.badgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.indigo}
            colors={[colors.indigo]}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* Category Hero Cover Card */}
            <View style={styles.coverWrapper}>
              <Image
                source={{ uri: categoryCovers[categoryInfo.name] || categoryInfo.coverImage }}
                style={styles.coverImage}
                resizeMode="cover"
              />
              <View style={styles.coverOverlay} />

              <View style={styles.coverContent}>
                {categoryInfo.badge && (
                  <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>{categoryInfo.badge}</Text>
                  </View>
                )}

                <Text style={styles.heroTitle}>{categoryInfo.title}</Text>
                <Text style={styles.heroSubtitle}>{categoryInfo.subtitle}</Text>

                <View style={styles.craftPill}>
                  <Layers size={13} color="#FFFFFF" />
                  <Text style={styles.craftPillText} numberOfLines={2}>
                    {categoryInfo.craftNote}
                  </Text>
                </View>
              </View>
            </View>

            {/* Size Chart & Fit Quick Action */}
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={styles.sizeGuideAction}
                activeOpacity={0.8}
                onPress={() => setSizeGuideVisible(true)}
              >
                <Ruler size={15} color={colors.indigo} />
                <Text style={styles.sizeGuideActionText}>
                  VIEW {categoryInfo.name} SIZE CHART &amp; FIT GUIDE
                </Text>
              </TouchableOpacity>
            </View>

            {/* Subcategory / Fit Filter Tags */}
            {categoryInfo.filterTags.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagsScroll}
              >
                {categoryInfo.filterTags.map((tag) => {
                  const active = selectedTag === tag;
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.tagChip, active && styles.tagChipActive]}
                      onPress={() => setSelectedTag(tag)}
                    >
                      <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Sort & Results Bar */}
            <View style={styles.sortBar}>
              <Text style={styles.resultsCount}>
                Showing <Text style={styles.bold}>{displayedProducts.length}</Text> styles
              </Text>

              {/* Sort pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortOptions}>
                <TouchableOpacity
                  style={[styles.sortChip, sortBy === "featured" && styles.sortChipActive]}
                  onPress={() => setSortBy("featured")}
                >
                  <Text style={[styles.sortChipText, sortBy === "featured" && styles.sortChipTextActive]}>
                    Featured
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sortChip, sortBy === "price_asc" && styles.sortChipActive]}
                  onPress={() => setSortBy("price_asc")}
                >
                  <Text style={[styles.sortChipText, sortBy === "price_asc" && styles.sortChipTextActive]}>
                    Price: Low → High
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sortChip, sortBy === "price_desc" && styles.sortChipActive]}
                  onPress={() => setSortBy("price_desc")}
                >
                  <Text style={[styles.sortChipText, sortBy === "price_desc" && styles.sortChipTextActive]}>
                    Price: High → Low
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sortChip, sortBy === "newest" && styles.sortChipActive]}
                  onPress={() => setSortBy("newest")}
                >
                  <Text style={[styles.sortChipText, sortBy === "newest" && styles.sortChipTextActive]}>
                    Newest
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <ProductCard product={item} />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyWrap}>
              <ActivityIndicator size="large" color={colors.indigo} />
              <Text style={styles.emptyText}>Loading collection...</Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No matching products</Text>
              <Text style={styles.emptySub}>
                Try selecting a different filter or check back during our next release.
              </Text>
              <TouchableOpacity
                style={styles.clearFilterBtn}
                onPress={() => setSelectedTag("All")}
              >
                <Text style={styles.clearFilterText}>CLEAR FILTER</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {/* Category Size Guide Modal */}
      <SizeGuideModal
        visible={sizeGuideVisible}
        onClose={() => setSizeGuideVisible(false)}
        category={categoryInfo.name}
        selectedSize={savedSizeMatch || ""}
        onSelectSize={() => {}}
        savedUserSize={savedSizeMatch}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.paper,
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
  navTitleCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  navTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 0.8,
  },
  navSub: {
    fontSize: 10,
    color: Colors.sub,
    marginTop: 2,
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
  listContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 12,
  },
  coverWrapper: {
    width: width,
    height: COVER_HEIGHT,
    position: "relative",
    backgroundColor: Colors.indigoDark,
    overflow: "hidden",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 20, 15, 0.65)",
  },
  coverContent: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.indigo,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  heroSubtitle: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  craftPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  craftPillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    flex: 1,
  },
  actionBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sizeGuideAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.indigoLight,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.indigo,
  },
  sizeGuideActionText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.indigoDark,
    letterSpacing: 0.6,
  },
  tagsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagChipActive: {
    backgroundColor: Colors.indigo,
    borderColor: Colors.indigo,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
  },
  tagChipTextActive: {
    color: "#FFFFFF",
  },
  sortBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  resultsCount: {
    fontSize: 11,
    color: Colors.sub,
    marginBottom: 6,
  },
  sortOptions: {
    gap: 6,
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.paper,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipActive: {
    backgroundColor: Colors.indigoLight,
    borderColor: Colors.indigo,
  },
  sortChipText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.sub,
  },
  sortChipTextActive: {
    color: Colors.indigoDark,
    fontWeight: "800",
  },
  columnWrapper: {
    paddingHorizontal: 16,
    gap: 12,
  },
  gridItem: {
    flex: 1,
    maxWidth: (width - 44) / 2,
  },
  bold: {
    fontWeight: "800",
    color: Colors.ink,
  },
  emptyWrap: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.ink,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.sub,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 12,
    color: Colors.sub,
  },
  clearFilterBtn: {
    backgroundColor: Colors.indigo,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 6,
  },
  clearFilterText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
});
