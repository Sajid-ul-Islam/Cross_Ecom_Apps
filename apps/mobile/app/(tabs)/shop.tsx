import React, { useEffect, useState, useCallback, useMemo } from "react";
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

import { Search, X, ArrowDownNarrowWide, ArrowUpNarrowWide, ArrowRight } from "../../src/components/Icons";
import { ScreenShell } from "../../src/components/ScreenShell";
import { ProductCard } from "../../src/components/ProductCard";
import { useTheme } from "../../src/context/ThemeContext";
import { sharedStyles } from "../../src/theme/sharedStyles";
import { usePullToRefresh } from "../../src/hooks/usePullToRefresh";
import { fetchProducts, CATEGORIES, useCatalogRefreshOnFocus, fetchSubCategories, type WooCategoryNode } from "../../src/services/gateway";
import { Product, DeenCategory } from "../../src/types";
import { getCategoryInfo, CategoryInfo } from "../../src/data/categories";

type SortKey = "default" | "price-asc" | "price-desc" | "name-asc" | "new";

export default function ShopScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const s = sharedStyles(colors);
  const params = useLocalSearchParams<{ category?: string }>();
  const [selectedCategory, setSelectedCategory] = useState<DeenCategory>(
    (params.category as DeenCategory) || "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [deferredQuery, setDeferredQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("default");
  const [segment, setSegment] = useState<"all" | "collection" | "select">("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Live WooCommerce sub-categories for filter chips
  const [subCategories, setSubCategories] = useState<WooCategoryNode[]>([]);
  const [selectedSubCat, setSelectedSubCat] = useState("All");

  // Fetch sub-categories whenever selectedCategory changes
  useEffect(() => {
    setSelectedSubCat("All");
    if (selectedCategory !== "ALL") {
      fetchSubCategories(selectedCategory)
        .then((subs) => setSubCategories(subs))
        .catch(() => setSubCategories([]));
    } else {
      setSubCategories([]);
    }
  }, [selectedCategory]);

  const styles = createStyles(colors, s);

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

  const loadProducts = useCallback(async () => {
    const sortParam = sort === "default" ? undefined : (sort as "price-asc" | "price-desc" | "name-asc" | "new");
    try {
      const data = await fetchProducts(selectedCategory, deferredQuery, sortParam, segment);
      setProducts(data);
    } catch {}
  }, [selectedCategory, deferredQuery, sort, segment]);

  // Client-side sub-category filtering on top of category products
  const displayedProducts = useMemo(() => {
    if (selectedSubCat === "All") return products;
    const subClean = selectedSubCat.toLowerCase();
    return products.filter((p) => {
      const matchInSubCats = p.wooSubCategories?.some((sc) => sc.toLowerCase() === subClean);
      const matchInName = p.name.toLowerCase().includes(subClean);
      return matchInSubCats || matchInName;
    });
  }, [products, selectedSubCat]);

  // Refresh catalog whenever the shop screen regains focus or the app resumes
  // from background — surfaces live WooCommerce stock/product changes without
  // a manual pull-to-refresh.
  useCatalogRefreshOnFocus(loadProducts);

  useEffect(() => {
    setLoading(true);
    loadProducts().finally(() => setLoading(false));
  }, [selectedCategory, deferredQuery, sort, segment]);

  const { refreshing, onRefresh: handleRefresh, refreshControl } = usePullToRefresh(loadProducts);

  const categorizedSections = useMemo(() => {
    if (selectedCategory !== "ALL" || deferredQuery.trim().length > 0) {
      return [];
    }
    const catList = CATEGORIES.filter((c) => c !== "ALL");
    const sections: { category: DeenCategory; info: CategoryInfo; items: Product[] }[] = [];

    catList.forEach((cat) => {
      const items = products.filter(
        (p) => p.category.toUpperCase() === cat.toUpperCase()
      );
      if (items.length > 0) {
        sections.push({
          category: cat,
          info: getCategoryInfo(cat),
          items,
        });
      }
    });

    const knownCats = new Set(catList.map((c) => c.toUpperCase()));
    const remaining = products.filter((p) => !knownCats.has(p.category.toUpperCase()));
    if (remaining.length > 0) {
      const firstCat = (remaining[0].category as DeenCategory) || "JEANS";
      sections.push({
        category: firstCat,
        info: getCategoryInfo(remaining[0].category),
        items: remaining,
      });
    }

    return sections;
  }, [products, selectedCategory, deferredQuery]);

  return (
    <ScreenShell title="CATEGORIES" showSearch={false}>

      {/* Search Bar */}
      <View style={[styles.searchSection, { backgroundColor: colors.paper }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.sub} />
          <TextInput
            style={[styles.input, { color: colors.ink }]}
            placeholder="Search by name, SKU, category…"
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

      {/* Brand Segmented Control — ALL · 💎 COLLECTION · ⚡ SELECT */}
      <View style={[styles.segmentBar, { backgroundColor: colors.paper }]}>
        {(
          [
            { key: "all", label: "ALL" },
            { key: "collection", label: "💎 COLLECTION" },
            { key: "select", label: "⚡ SELECT" },
          ] as const
        ).map(({ key, label }) => {
          const active = segment === key;
          const isSelect = key === "select";
          const isCollection = key === "collection";
          const activeBg = isSelect
            ? "#92400E"
            : isCollection
            ? colors.indigoDark
            : colors.indigoDark;
          const activeText = "#FFFFFF";
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.segPill,
                { backgroundColor: colors.card, borderColor: colors.border },
                active && { backgroundColor: activeBg, borderColor: activeBg },
              ]}
              activeOpacity={0.8}
              onPress={() => setSegment(key)}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${label}`}
            >
              <Text
                style={[
                  styles.segPillText,
                  { color: colors.sub },
                  active && { color: activeText },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Visual Category Showcase Tiles */}
      <View style={[styles.categoriesContainer, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            const info = getCategoryInfo(cat);
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catTile,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  active && [styles.catTileActive, { borderColor: colors.indigoDark, backgroundColor: colors.cardSecondary }],
                ]}
                activeOpacity={0.85}
                onPress={() => setSelectedCategory(cat)}
              >
                {cat !== "ALL" && info.coverImage ? (
                  <Image source={{ uri: info.coverImage }} style={styles.catTileImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.catTileImgPlaceholder, { backgroundColor: colors.indigoDark }]}>
                    <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "900" }}>ALL</Text>
                  </View>
                )}
                <View style={styles.catTileTextWrapper}>
                  <Text
                    style={[
                      styles.catTileName,
                      { color: colors.ink },
                      active && { color: colors.indigo, fontWeight: "900" },
                    ]}
                    numberOfLines={1}
                  >
                    {cat}
                  </Text>
                  {active && <View style={[styles.activeDot, { backgroundColor: colors.indigo }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Live WooCommerce Sub-Category Filter Chips */}
      {selectedCategory !== "ALL" && subCategories.length > 0 && (
        <View style={[styles.subCatBar, { backgroundColor: colors.paper, borderBottomColor: colors.borderLight }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subCatScroll}
          >
            {["All", ...subCategories.map((s) => s.name)].map((subName) => {
              const active = selectedSubCat === subName;
              return (
                <TouchableOpacity
                  key={subName}
                  style={[
                    styles.subCatPill,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    active && [styles.subCatPillActive, { backgroundColor: colors.indigoDark, borderColor: colors.indigoDark }],
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedSubCat(subName)}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by subcategory ${subName}`}
                >
                  <Text
                    style={[
                      styles.subCatText,
                      { color: colors.sub },
                      active && [styles.subCatTextActive, { color: "#FFFFFF" }],
                    ]}
                  >
                    {subName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

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
          SHOWING {displayedProducts.length} {displayedProducts.length === 1 ? "PRODUCT" : "PRODUCTS"}
          {selectedSubCat !== "All" ? ` · ${selectedSubCat}` : ""}
        </Text>
        {(selectedCategory !== "ALL" || searchQuery.length > 0 || selectedSubCat !== "All") && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              setSelectedCategory("ALL");
              setSelectedSubCat("All");
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
      ) : displayedProducts.length === 0 ? (
        <View style={[styles.emptyContainer, { flex: 1 }]}>
          <Text style={[styles.emptyTitle, { color: colors.ink }]}>No products found</Text>
          <Text style={[styles.emptySub, { color: colors.sub }]}>
            Try changing your search terms or selecting another category.
          </Text>
          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: colors.indigo }]}
            onPress={() => {
              setSelectedCategory("ALL");
              setSelectedSubCat("All");
              setSearchQuery("");
            }}
          >
            <Text style={styles.resetBtnText}>SHOW ALL PRODUCTS</Text>
          </TouchableOpacity>
        </View>
      ) : selectedCategory === "ALL" && deferredQuery.trim().length === 0 && categorizedSections.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {categorizedSections.map((section) => (
            <View key={section.category} style={styles.categorySection}>
              {/* Category Cover Banner with Title & Poetic Description */}
              <TouchableOpacity
                style={[styles.categoryHeroBanner, { backgroundColor: colors.indigoDark }]}
                activeOpacity={0.88}
                onPress={() => setSelectedCategory(section.category)}
              >
                <Image
                  source={{ uri: section.info.coverImage }}
                  style={styles.categoryHeroImage}
                  resizeMode="cover"
                />
                <View style={styles.categoryHeroOverlay} />
                <View style={styles.categoryHeroContent}>
                  <View style={styles.categoryHeroTop}>
                    <Text style={styles.categoryHeroTitle}>
                      {section.info.title}
                    </Text>
                    <View style={[styles.landingPageLink, { backgroundColor: colors.indigo }]}>
                      <Text style={styles.landingPageLinkText}>View All ({section.items.length})</Text>
                      <ArrowRight size={12} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={styles.categoryHeroSub} numberOfLines={1}>
                    {section.info.subtitle}
                  </Text>
                  {section.info.description ? (
                    <Text style={styles.categoryHeroDescription} numberOfLines={2}>
                      {section.info.description}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>

              {/* Preview Grid of Products (up to 4 items in 2 columns) */}
              <View style={styles.previewGrid}>
                {section.items.slice(0, 4).map((item) => (
                  <View key={item.id} style={styles.previewGridItem}>
                    <ProductCard product={item} />
                  </View>
                ))}
              </View>

              {/* Explore All Category CTA */}
              <TouchableOpacity
                style={[styles.exploreCategoryBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Explore all ${section.info.title} products`}
                onPress={() => setSelectedCategory(section.category)}
              >
                <Text style={[styles.exploreCategoryBtnText, { color: colors.indigo }]}>
                  EXPLORE ALL {section.info.title.toUpperCase()} ({section.items.length} ITEMS)
                </Text>
                <ArrowRight size={13} color={colors.indigo} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={displayedProducts}
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
                  <Text style={styles.categoryHeroSub} numberOfLines={1}>
                    {getCategoryInfo(selectedCategory).subtitle}
                  </Text>
                  {getCategoryInfo(selectedCategory).description ? (
                    <Text style={styles.categoryHeroDescription} numberOfLines={2}>
                      {getCategoryInfo(selectedCategory).description}
                    </Text>
                  ) : null}
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
    </ScreenShell>
  );
}

function createStyles(colors: any, s: ReturnType<typeof sharedStyles>) {
  return StyleSheet.create({
    searchSection: {
      paddingHorizontal: 10,
      paddingVertical: 8,
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
    segmentBar: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    segPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
    },
    segPillText: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    categoriesContainer: {
      paddingBottom: 8,
    },
    categoryScroll: {
      paddingHorizontal: 10,
      gap: 8,
    },
    catTile: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 5,
      paddingHorizontal: 8,
      borderRadius: 20,
      borderWidth: 1,
      gap: 7,
    },
    catTileActive: {
      borderWidth: 1.5,
    },
    catTileImg: {
      width: 26,
      height: 26,
      borderRadius: 13,
    },
    catTileImgPlaceholder: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    catTileTextWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingRight: 4,
    },
    catTileName: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    activeDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
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
    subCatBar: {
      paddingVertical: 8,
      borderBottomWidth: 1,
    },
    subCatScroll: {
      paddingHorizontal: 10,
      gap: 8,
    },
    subCatPill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    subCatPillActive: {},
    subCatText: {
      fontSize: 12,
      fontWeight: "700",
    },
    subCatTextActive: {
      fontWeight: "800",
    },
    sortBar: {
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: 10,
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
      paddingHorizontal: 10,
      paddingVertical: 6,
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
      paddingHorizontal: 8,
      paddingTop: 4,
      paddingBottom: 24,
    },
    row: {
      gap: 8,
    },
    gridItem: {
      flex: 1,
      maxWidth: "50%",
      marginBottom: 8,
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
      minHeight: 135,
      borderRadius: 10,
      overflow: "hidden",
      position: "relative",
      marginBottom: 14,
      justifyContent: "flex-end",
    },
    categoryHeroImage: {
      ...StyleSheet.absoluteFill,
      width: "100%",
      height: "100%",
    },
    categoryHeroOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(10, 20, 15, 0.65)",
    },
    categoryHeroContent: {
      padding: 12,
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
    categoryHeroDescription: {
      color: "rgba(255, 255, 255, 0.92)",
      fontSize: 11,
      lineHeight: 15,
      marginTop: 4,
    },
    categorySection: {
      marginBottom: 24,
    },
    previewGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    previewGridItem: {
      width: "48.5%",
      marginBottom: 8,
    },
    exploreCategoryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 8,
    },
    exploreCategoryBtnText: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
  });
}
