import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight, Sparkles, ShieldCheck, MapPin, Award, TrendingUp, Package, Tag, Users } from "../../src/components/Icons";
import { Header } from "../../src/components/Header";
import { FreeTeeBanner, DeliveryNoticeBanner } from "../../src/components/Banner";
import { ProductCard } from "../../src/components/ProductCard";
import { Sparkline, CategoryBars, Donut, KpiTile } from "../../src/components/Charts";
import { Colors } from "../../src/theme/colors";
import { useTheme } from "../../src/context/ThemeContext";
import { fetchProducts, fetchStats, CATEGORIES, bdt, useCatalogRefreshOnFocus } from "../../src/services/gateway";
import { Product, DeenCategory, Stats } from "../../src/types";
import { useProfile } from "../../src/context/ProfileContext";
import { getCategoryInfo } from "../../src/data/categories";
import { AdminBroadcastModal } from "../../src/components/AdminBroadcastModal";
import { UserModeBar } from "../../src/components/UserModeBar";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { colors, isDark } = useTheme();
  const isAdmin = profile.role === "admin" || profile.username === "admin";
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [broadcastModalVisible, setBroadcastModalVisible] = useState(false);

  const loadData = async () => {
    try {
      const p = await fetchProducts();
      setProducts(p);
      if (isAdmin) {
        const s = await fetchStats();
        setStats(s);
      }
    } catch {}
  };

  // Refresh catalog + admin stats whenever the home screen regains focus or
  // the app resumes from background — keeps live WooCommerce changes (stock,
  // new products, price edits) in sync without a manual pull-to-refresh.
  useCatalogRefreshOnFocus(loadData);

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const newDrops = products.filter((p) => p.isNew || (p.salePct && p.salePct > 0)).slice(0, 10);
  const jeansCollection = products.filter((p) => p.category === "JEANS").slice(0, 10);
  const festivePanjabi = products.filter((p) => p.category === "PANJABI").slice(0, 10);
  const bestDeals = [...products].filter((p) => (p.salePct || 0) > 0).sort((a, b) => (b.salePct ?? 0) - (a.salePct ?? 0)).slice(0, 8);

  const handleCategoryPress = (cat: DeenCategory | string) => {
    router.push({
      pathname: "/category/[slug]",
      params: { slug: cat },
    });
  };

  const salesSeries = stats?.sales.series.map((d) => d.sales) ?? [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]} edges={["top"]}>
      <Header />
      <DeliveryNoticeBanner />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.indigo}
            colors={[Colors.indigo]}
          />
        }
      >
        {/* Quick Role & Mode Switcher Bar */}
        <UserModeBar />

        <FreeTeeBanner />

        {/* Hero Section */}
        <View style={styles.heroWrapper}>
          <Image
            source={{
              uri: "https://image.qwenlm.ai/generated-images/6632ddf9-2268-4bf4-aee4-f16c6a71bf78/_result.png",
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroBadge}>
              <Sparkles size={12} color="#FFFFFF" />
              <Text style={styles.heroBadgeText}>EST. 2018 · DHAKA</Text>
            </View>
            <Text style={styles.heroTagline}>দেশের প্রথম ডেনিম ব্র্যান্ড</Text>
            <Text style={styles.heroTitle}>ARTISANAL INDIGO &amp; RAW SELVEDGE</Text>
            <Text style={styles.heroSub}>
              Engineered for Bangladesh’s climate with authentic shuttle-loom selvage &amp; pure dobby jacquards.
            </Text>

            <TouchableOpacity
              style={styles.heroBtn}
              activeOpacity={0.85}
              onPress={() => router.push("/(tabs)/shop")}
            >
              <Text style={styles.heroBtnText}>EXPLORE COLLECTION</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ADMIN ONLY — Store Insights / BI dashboard.
            Customers never see sales data. Gated by role. */}
        {isAdmin && stats ? (
          <View style={styles.insightsCard}>
            <View style={styles.insightsHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <TrendingUp size={16} color={Colors.indigo} />
                <Text style={styles.insightsTitle}>STORE INSIGHTS · ADMIN</Text>
              </View>
              <View style={[styles.modePill, { backgroundColor: stats.mode === "live" ? Colors.emeraldLight : Colors.amberLight }]}>
                <Text style={[styles.modePillText, { color: stats.mode === "live" ? Colors.emerald : Colors.amber }]}>
                  {stats.mode === "live" ? "LIVE · deencommerce.com" : "SEED"}
                </Text>
              </View>
            </View>

            {/* KPI row */}
            <View style={styles.kpiRow}>
              <KpiTile label="Products" value={String(stats.store.totalProducts)} sub="in catalog" accent={Colors.indigo} />
              <KpiTile label="On Sale" value={String(stats.store.onSale)} sub={`${Math.round((stats.store.onSale / (stats.store.totalProducts || 1)) * 100)}% off`} accent={Colors.crimson} />
              <KpiTile label="Avg Price" value={bdt(stats.store.avgPrice)} sub="per item" accent={Colors.denimStitch} />
            </View>

            {/* Sales sparkline */}
            <View style={styles.block}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>SALES · {stats.sales.period}</Text>
                <Text style={styles.blockValue}>{bdt(stats.sales.totalSales)}</Text>
              </View>
              <Sparkline data={salesSeries} width={width - 64} height={56} color={Colors.indigo} />
              <View style={styles.blockFooter}>
                <Text style={styles.footText}>📦 {stats.sales.orders} orders</Text>
                <Text style={styles.footText}>👥 {stats.sales.newCustomers} visitors</Text>
                <Text style={styles.footText}>🚚 {bdt(stats.sales.shipping)} ship</Text>
              </View>
            </View>

            <View style={styles.blockDivider} />

            {/* Category breakdown + stock donut */}
            <View style={styles.splitRow}>
              <View style={styles.splitLeft}>
                <Text style={styles.blockTitle}>CATEGORY STOCK</Text>
                <CategoryBars data={stats.categories.slice(0, 6)} />
              </View>
              <View style={styles.splitRight}>
                <Donut
                  value={stats.store.totalProducts - stats.store.outOfStock}
                  total={stats.store.totalProducts}
                  label="In Stock"
                  color={Colors.emerald}
                />
              </View>
            </View>

            {stats.topSellers.length > 0 && (
              <>
                <View style={styles.blockDivider} />
                <Text style={styles.blockTitle}>TOP DEALS THIS MONTH</Text>
                {stats.topSellers.slice(0, 3).map((t, i) => (
                  <View key={i} style={styles.topRow}>
                    <View style={[styles.topRank, { backgroundColor: i === 0 ? Colors.denimStitch : Colors.cardSecondary }]}>
                      <Text style={[styles.topRankText, { color: i === 0 ? "#fff" : Colors.sub }]}>{i + 1}</Text>
                    </View>
                    <Text style={styles.topName} numberOfLines={1}>{t.name}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Quick Broadcast Action */}
            <TouchableOpacity
              style={styles.quickBroadcastBtn}
              activeOpacity={0.88}
              onPress={() => setBroadcastModalVisible(true)}
            >
              <Sparkles size={14} color="#FFFFFF" />
              <Text style={styles.quickBroadcastText}>📢 SEND MARKETING BROADCAST PUSH</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Categories Showcase with Cover Images */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>EXPLORE COLLECTIONS</Text>
            <Text style={styles.sectionSubtitle}>Tailored menswear crafted in Bangladesh</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/shop")}>
            <Text style={styles.seeAllText}>All Items →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryCardScroll}
        >
          {CATEGORIES.filter((c) => c !== "ALL").map((cat) => {
            const info = getCategoryInfo(cat);
            const count = products.filter((p) => p.category.toUpperCase() === cat.toUpperCase()).length;
            return (
              <TouchableOpacity
                key={cat}
                style={styles.catCard}
                activeOpacity={0.88}
                onPress={() => handleCategoryPress(cat)}
              >
                <Image source={{ uri: info.coverImage }} style={styles.catCardImage} resizeMode="cover" />
                <View style={styles.catCardOverlay} />
                <View style={styles.catCardContent}>
                  {info.badge && (
                    <View style={styles.catCardBadge}>
                      <Text style={styles.catCardBadgeText}>{info.badge}</Text>
                    </View>
                  )}
                  <Text style={styles.catCardTitle}>{info.name}</Text>
                  <Text style={styles.catCardCount}>{count > 0 ? `${count} Items` : "Explore Vault"}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Best Deals */}
        {bestDeals.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>BEST DEALS</Text>
                <Text style={styles.sectionSubtitle}>Highest discount live right now</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/(tabs)/shop")}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalProductList}
            >
              {bestDeals.map((product) => (
                <View key={product.id} style={styles.horizontalCardWrapper}>
                  <ProductCard product={product} />
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* New Drops Carousel */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>NEW &amp; TRENDING</Text>
            <Text style={styles.sectionSubtitle}>Fresh denim cuts &amp; festive kurta silhouettes</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/shop")}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalProductList}
        >
          {newDrops.map((product) => (
            <View key={product.id} style={styles.horizontalCardWrapper}>
              <ProductCard product={product} />
            </View>
          ))}
        </ScrollView>

        {/* Denim Masterpieces */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>SIGNATURE DENIM</Text>
            <Text style={styles.sectionSubtitle}>100% Cotton Selvedge &amp; Comfort Stretch Jeans</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {jeansCollection.map((product) => (
            <View key={product.id} style={styles.gridItem}>
              <ProductCard product={product} />
            </View>
          ))}
        </View>

        {/* Festive Panjabi Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>HERITAGE PANJABI &amp; KURTA</Text>
            <Text style={styles.sectionSubtitle}>Indigo dyed pure dobby cottons</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {festivePanjabi.map((product) => (
            <View key={product.id} style={styles.gridItem}>
              <ProductCard product={product} />
            </View>
          ))}
        </View>

        {/* Brand Authenticity Footer Card */}
        <View style={styles.brandTrustCard}>
          <View style={styles.trustItem}>
            <Award size={20} color={Colors.indigo} />
            <Text style={styles.trustTitle}>Authentic Quality</Text>
            <Text style={styles.trustDesc}>Pre-shrunk premium indigo textiles with guaranteed dye-fastness.</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
            <ShieldCheck size={20} color={Colors.emerald} />
            <Text style={styles.trustTitle}>e-CAB Registered</Text>
            <Text style={styles.trustDesc}>Trusted e-commerce brand with official registration &amp; COD nationwide.</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
            <MapPin size={20} color={Colors.crimson} />
            <Text style={styles.trustTitle}>Flagship Stores</Text>
            <Text style={styles.trustDesc}>Mirpur 12 (Dhaka) · Wari (Dhaka) · Cumilla Outlets</Text>
          </View>
        </View>
      </ScrollView>

      {/* Admin Broadcast Marketing Modal */}
      <AdminBroadcastModal
        visible={broadcastModalVisible}
        onClose={() => setBroadcastModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.paper },
  scrollContent: { paddingBottom: 24 },
  heroWrapper: {
    marginHorizontal: 16, marginTop: 8, marginBottom: 16, height: 380,
    borderRadius: 12, overflow: "hidden", backgroundColor: Colors.indigoDark, position: "relative",
  },
  heroImage: { width: "100%", height: "100%", opacity: 0.65 },
  heroOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0, padding: 20,
    justifyContent: "flex-end", backgroundColor: "rgba(21, 26, 44, 0.45)",
  },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.denimStitch,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: "flex-start", marginBottom: 8,
  },
  heroBadgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  heroTagline: { fontSize: 14, color: Colors.amberLight, fontWeight: "700", marginBottom: 4 },
  heroTitle: { fontSize: 22, fontWeight: "900", color: "#FFFFFF", letterSpacing: 0.5, lineHeight: 28, marginBottom: 6 },
  heroSub: { fontSize: 12, color: "#E2E8F0", lineHeight: 18, marginBottom: 14 },
  heroBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.indigo,
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, alignSelf: "flex-start",
    borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.2)",
  },
  heroBtnText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
    paddingHorizontal: 16, marginTop: 18, marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: Colors.ink, letterSpacing: 0.8 },
  sectionSubtitle: { fontSize: 11, color: Colors.sub, marginTop: 2 },
  seeAllText: { fontSize: 12, color: Colors.indigo, fontWeight: "700" },
  categoryCardScroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  catCard: {
    width: 140,
    height: 180,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: Colors.indigoDark,
    position: "relative",
  },
  catCardImage: {
    width: "100%",
    height: "100%",
  },
  catCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 20, 15, 0.55)",
  },
  catCardContent: {
    position: "absolute",
    bottom: 12,
    left: 10,
    right: 10,
  },
  catCardBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.indigo,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginBottom: 4,
  },
  catCardBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  catCardTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  catCardCount: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
    marginTop: 2,
  },
  categoryScroll: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  categoryChip: {
    backgroundColor: Colors.card, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
  },
  categoryChipText: { fontSize: 11, fontWeight: "700", color: Colors.ink, letterSpacing: 0.5 },
  horizontalProductList: { paddingHorizontal: 16, gap: 12 },
  horizontalCardWrapper: { width: width * 0.46 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, justifyContent: "space-between" },
  gridItem: { width: "48%" },
  brandTrustCard: {
    backgroundColor: Colors.card, borderRadius: 10, marginHorizontal: 16, marginTop: 20,
    padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  trustItem: { paddingVertical: 8 },
  trustTitle: { fontSize: 13, fontWeight: "700", color: Colors.ink, marginTop: 4, marginBottom: 2 },
  trustDesc: { fontSize: 11, color: Colors.sub, lineHeight: 16 },
  trustDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },
  // insights
  loadingCard: { margin: 16, padding: 24, alignItems: "center", backgroundColor: Colors.card, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  loadingText: { marginTop: 8, fontSize: 12, color: Colors.sub },
  insightsCard: {
    margin: 16, backgroundColor: Colors.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  insightsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  insightsTitle: { fontSize: 14, fontWeight: "900", color: Colors.ink, letterSpacing: 0.6 },
  modePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  modePillText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  kpiRow: { flexDirection: "row", gap: 8 },
  block: { marginTop: 14 },
  blockHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 },
  blockTitle: { fontSize: 11, fontWeight: "800", color: Colors.sub, letterSpacing: 0.6, textTransform: "uppercase" },
  blockValue: { fontSize: 15, fontWeight: "900", color: Colors.indigoDark },
  blockFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  footText: { fontSize: 10, color: Colors.sub },
  blockDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 14 },
  splitRow: { flexDirection: "row", alignItems: "center" },
  splitLeft: { flex: 1 },
  splitRight: { width: 96, alignItems: "center" },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  topRank: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  topRankText: { fontSize: 11, fontWeight: "800" },
  topName: { flex: 1, fontSize: 12, fontWeight: "600", color: Colors.ink },
  quickBroadcastBtn: {
    backgroundColor: Colors.indigo,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 14,
  },
  quickBroadcastText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
});
