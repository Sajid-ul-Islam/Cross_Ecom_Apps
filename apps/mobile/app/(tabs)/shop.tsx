import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, X, ArrowDownNarrowWide, ArrowUpNarrowWide, ArrowRight } from "../../src/components/Icons";
import { Header } from "../../src/components/Header";
import { ProductCard } from "../../src/components/ProductCard";
import { useTheme } from "../../src/context/ThemeContext";
import { fetchProducts, CATEGORIES, useCatalogRefreshOnFocus } from "../../src/services/gateway";
import { Product, DeenCategory } from "../../src/types";
import { getCategoryInfo } from "../../src/data/categories";

type SortKey = "default" | "price-asc" | "price-desc" | "name-asc" | "new";

export default function ShopScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ category?: string }>();
  const [selectedCategory, setSelectedCategory] = useState<DeenCategory>(
    (params.category as DeenCategory) || "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [deferredQuery, setDeferredQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("default");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const styles = createStyles(colors);

  // Debounce search input (200ms) so filtering large lists stays smooth.
  useEffect(() => {
    const t = setTimeout(() => setDeferredQuery(searchQuery), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    if (params.category && params.category !== selectedCategory) {
      setSelectedCategory(params.category as DeenCategory);
    }
  }, [params.category]);

  const loadProducts = async () => {
    const sortParam = sort === "default" ? undefined : (sort as "price-asc" | "price-desc" | "name-asc" | "new");
    try {
      const data = await fetchProducts(selectedCategory, deferredQuery, sortParam);
      setProducts(data);
    } catch {}
  };

  // Refresh catalog whenever the shop screen regains focus or the app resumes
  // from background — surfaces live WooCommerce stock/product changes without
  // a manual pull-to-refresh.
  useCatalogRefreshOnFocus(loadProducts);

  useEffect(() => {
    setLoading(true);
    loadProducts().finally(() => setLoading(false));
  }, [selectedCategory, deferredQuery, sort]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]} edges={["top"]}>
      <Header title="SHOP COLLECTION" showSearch={false} />

      {/* Search Bar */}
      <View style={[styles.searchSection, { backgroundColor: colors.paper }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.sub} />
          <TextInput
            style={[styles.input, { color: colors.ink }]}
            placeholder="Search jeans, panjabi, shirts, fabric..."
            placeholderTextColor={colors.faint}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color={colors.sub} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Pills */}
      <View style={[styles.categoriesContainer, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  active && [styles.categoryChipActive, { backgroundColor: colors.indigoDark, borderColor: colors.indigoDark }],
                ]}
                activeOpacity={0.75}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[
                  styles.categoryChipText,
                  { color: colors.sub },
                  active && styles.categoryChipTextActive,
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sort Bar */}
      <View style={styles.sortBar}>
        <TouchableOpacity
          style={[
            styles.sortChip,
            { backgroundColor: colors.card, borderColor: colors.border },
            sort === "default" && [styles.sortChipActive, { backgroundColor: colors.indigoDark, borderColor: colors.indigoDark }],
          ]}
          activeOpacity={0.7}
          onPress={() => setSort("default")}
        >
          <Text style={[
            styles.sortChipText,
            { color: colors.sub },
            sort === "default" && styles.sortChipTextActive,
          ]}>
            Featured
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortChip,
            { backgroundColor: colors.card, borderColor: colors.border },
            sort === "price-asc" && [styles.sortChipActive, { backgroundColor: colors.indigoDark, borderColor: colors.indigoDark }],
          ]}
          activeOpacity={0.7}
          onPress={() => setSort("price-asc")}
        >
          <ArrowUpNarrowWide size={13} color={sort === "price-asc" ? "#fff" : colors.sub} />
          <Text style={[
            styles.sortChipText,
            { color: colors.sub },
            sort === "price-asc" && styles.sortChipTextActive,
          ]}>
            Price
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortChip,
            { backgroundColor: colors.card, borderColor: colors.border },
            sort === "price-desc" && [styles.sortChipActive, { backgroundColor: colors.indigoDark, borderColor: colors.indigoDark }],
          ]}
          activeOpacity={0.7}
          onPress={() => setSort("price-desc")}
        >
          <ArrowDownNarrowWide size={13} color={sort === "price-desc" ? "#fff" : colors.sub} />
          <Text style={[
            styles.sortChipText,
            { color: colors.sub },
            sort === "price-desc" && styles.sortChipTextActive,
          ]}>
            Price
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortChip,
            { backgroundColor: colors.card, borderColor: colors.border },
            sort === "name-asc" && [styles.sortChipActive, { backgroundColor: colors.indigoDark, borderColor: colors.indigoDark }],
          ]}
          activeOpacity={0.7}
          onPress={() => setSort("name-asc")}
        >
          <Text style={[
            styles.sortChipText,
            { color: colors.sub },
            sort === "name-asc" && styles.sortChipTextActive,
          ]}>
            A–Z
          </Text>
        </TouchableOpacity>
      </View>

      {/* Header with Result Count */}
      <View style={styles.metaRow}>
        <Text style={[styles.resultCount, { color: colors.sub }]}>
          SHOWING {products.length} {products.length === 1 ? "PRODUCT" : "PRODUCTS"}
        </Text>
        {(selectedCategory !== "ALL" || searchQuery.length > 0) && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              setSelectedCategory("ALL");
              setSearchQuery("");
            }}
          >
            <Text style={[styles.clearBtnText, { color: colors.crimson }]}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Products Grid or Loading */}
      {loading ? (
        <View style={[styles.centerContainer, { flex: 1 }]}>
          <ActivityIndicator size="large" color={colors.indigo} />
          <Text style={[styles.loadingText, { color: colors.sub }]}>Fetching DEEN catalog...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={[styles.emptyContainer, { flex: 1 }]}>
          <Text style={[styles.emptyTitle, { color: colors.ink }]}>No products found</Text>
          <Text style={[styles.emptySub, { color: colors.sub }]}>
            Try changing your search terms or selecting another category.
          </Text>
          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: colors.indigo }]}
            onPress={() => {
              setSelectedCategory("ALL");
              setSearchQuery("");
            }}
          >
            <Text style={styles.resetBtnText}>SHOW ALL PRODUCTS</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews
          ListHeaderComponent={
            selectedCategory !== "ALL" ? (
              <TouchableOpacity
                style={[styles.categoryHeroBanner, { backgroundColor: colors.indigoDark }]}
                activeOpacity={0.88}
                onPress={() =>
                  router.push({
                    pathname: "/category/[slug]",
                    params: { slug: selectedCategory },
                  })
                }
              >
                <Image
                  source={{ uri: getCategoryInfo(selectedCategory).coverImage }}
                  style={styles.categoryHeroImage}
                  resizeMode="cover"
                />
                <View style={styles.categoryHeroOverlay} />
                <View style={styles.categoryHeroContent}>
                  <View style={styles.categoryHeroTop}>
                    <Text style={styles.categoryHeroTitle}>
                      {getCategoryInfo(selectedCategory).title}
                    </Text>
                    <View style={[styles.landingPageLink, { backgroundColor: colors.indigo }]}>
                      <Text style={styles.landingPageLinkText}>Full Page</Text>
                      <ArrowRight size={12} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={styles.categoryHeroSub} numberOfLines={2}>
                    {getCategoryInfo(selectedCategory).subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ProductCard product={item} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.paper,
    },
    searchSection: {
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 8,
      paddingHorizontal: 12,
      height: 42,
      borderWidth: 1,
      gap: 8,
    },
    input: {
      flex: 1,
      fontSize: 13,
      height: "100%",
    },
    categoriesContainer: {
      paddingBottom: 8,
    },
    categoryScroll: {
      paddingHorizontal: 16,
      gap: 6,
    },
    categoryChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
    },
    categoryChipActive: {},
    categoryChipText: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    categoryChipTextActive: {
      color: "#FFFFFF",
    },
    sortBar: {
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    sortChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      borderWidth: 1,
    },
    sortChipActive: {},
    sortChipText: {
      fontSize: 11,
      fontWeight: "700",
    },
    sortChipTextActive: {
      color: "#FFFFFF",
    },
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    resultCount: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
    },
    clearBtn: {
      paddingVertical: 2,
    },
    clearBtnText: {
      fontSize: 11,
      fontWeight: "600",
    },
    scrollContent: {
      paddingBottom: 24,
      paddingHorizontal: 16,
    },
    row: {
      justifyContent: "space-between",
    },
    gridItem: {
      width: "48%",
      marginBottom: 12,
    },
    centerContainer: {
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    loadingText: {
      fontSize: 12,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
    },
    emptySub: {
      fontSize: 12,
      textAlign: "center",
      lineHeight: 18,
      marginBottom: 8,
    },
    resetBtn: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 6,
    },
    resetBtnText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
    categoryHeroBanner: {
      height: 120,
      borderRadius: 10,
      overflow: "hidden",
      position: "relative",
      marginBottom: 14,
    },
    categoryHeroImage: {
      width: "100%",
      height: "100%",
    },
    categoryHeroOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(10, 20, 15, 0.6)",
    },
    categoryHeroContent: {
      position: "absolute",
      bottom: 12,
      left: 12,
      right: 12,
    },
    categoryHeroTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    categoryHeroTitle: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "900",
      letterSpacing: 0.5,
      flex: 1,
      marginRight: 8,
    },
    landingPageLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    landingPageLinkText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "800",
    },
    categoryHeroSub: {
      color: "rgba(255, 255, 255, 0.85)",
      fontSize: 10,
      lineHeight: 14,
    },
  });
}
