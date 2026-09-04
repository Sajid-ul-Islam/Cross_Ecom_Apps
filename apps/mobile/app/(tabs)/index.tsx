import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";

import { ArrowRight, Sparkles, ShieldCheck, MapPin, Award, TrendingUp } from "../../src/components/Icons";
import { SectionHeader } from "../../src/components/SectionHeader";
import { ScreenShell } from "../../src/components/ScreenShell";
import { DeliveryNoticeBanner } from "../../src/components/Banner";
import { StoreNoticeBanner } from "../../src/components/StoreNoticeBanner";
import { ProductCard } from "../../src/components/ProductCard";
import { Sparkline, CategoryBars, Donut, KpiTile } from "../../src/components/Charts";
import { ThemeColors } from "../../src/theme/colors";
import { sharedStyles } from "../../src/theme/sharedStyles";
import { useTheme } from "../../src/context/ThemeContext";
import { usePullToRefresh } from "../../src/hooks/usePullToRefresh";
import { fetchProducts, fetchStats, CATEGORIES, bdt, useCatalogRefreshOnFocus } from "../../src/services/gateway";
import { Product, DeenCategory, Stats } from "../../src/types";
import { useProfile } from "../../src/context/ProfileContext";
import { getCategoryInfo } from "../../src/data/categories";
import { AdminBroadcastModal } from "../../src/components/AdminBroadcastModal";
import { FestivalGreetingModal } from "../../src/components/FestivalGreetingModal";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { colors, isDark } = useTheme();
  const s = sharedStyles(colors);
  const isAdmin = profile.role === "admin" || profile.username === "admin";
  const styles = createStyles(colors, s);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const [broadcastModalVisible, setBroadcastModalVisible] = useState(false);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  const HERO_SLIDES = [
    {
      id: "slide_denim",
      image: "https://deencommerce.com/wp-content/uploads/2026/08/Mobile-Hero-Banner.jpg",
    },
    {
      id: "slide_shirt",
      image: "https://deencommerce.com/wp-content/uploads/2026/08/web-banner-1.jpg",
    },
    {
      id: "slide_tailoring",
      image: "https://deencommerce.com/wp-content/uploads/2026/08/web-banner.jpg",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % 3);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const p = await fetchProducts();
      setProducts(p);
      if (isAdmin) {
        const s = await fetchStats();
        setStats(s);
      }
    } catch {}
  }, [isAdmin]);

  // Refresh catalog + admin stats whenever the home screen regains focus or
  // the app resumes from background — keeps live WooCommerce changes (stock,
  // new products, price edits) in sync without a manual pull-to-refresh.
  useCatalogRefreshOnFocus(loadData);

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const { refreshControl } = usePullToRefresh(loadData);

  const newDrops = products.filter((p) => p.isNew || (p.salePct && p.salePct > 0)).slice(0, 10);
  const jeansCollection = products.filter((p) => p.category === "JEANS").slice(0, 10);
  const heritagePanjabi = products.filter((p) => p.category === "PANJABI").slice(0, 10);
  const bestDeals = [...products].filter((p) => (p.salePct || 0) > 0).sort((a, b) => (b.salePct ?? 0) - (a.salePct ?? 0)).slice(0, 8);

  const handleCategoryPress = (cat: DeenCategory | string) => {
    router.push({
      pathname: "/category/[slug]",
      params: { slug: cat },
    });
  };

  const salesSeries = stats?.sales.series.map((d) => d.sales) ?? [];

  const bestSellerScrollRef = React.useRef<ScrollView>(null);
  const bestSellerScrollPos = React.useRef(0);
  const isUserScrollingBestSellers = React.useRef(false);

  // --- Category marquee auto-scroll ---
  const catScrollRef = React.useRef<ScrollView>(null);
  const catScrollPos = React.useRef(0);
  const isUserScrollingCat = React.useRef(false);
  const categories = CATEGORIES.filter((c) => c !== "ALL");

  useEffect(() => {
    if (!bestDeals || bestDeals.length <= 1) return;
    // Duplicate list renders 2× items; loop resets at the halfway mark
    const cardWidth = Math.round(width * 0.46) + 12;
    const halfTotal = cardWidth * bestDeals.length; // midpoint = 1 full copy

    // Smooth ticker: advance 1 px every 45 ms ≈ 22 px / s (gentle & slow glide)
    const STEP = 1;
    const INTERVAL_MS = 45;

    const timer = setInterval(() => {
      if (isUserScrollingBestSellers.current) return;
      bestSellerScrollPos.current += STEP;
      // Seamless loop: silently jump back to 0 when halfway through duplicated list
      if (bestSellerScrollPos.current >= halfTotal) {
        bestSellerScrollPos.current = 0;
        bestSellerScrollRef.current?.scrollTo({ x: 0, animated: false });
        return;
      }
      bestSellerScrollRef.current?.scrollTo({
        x: bestSellerScrollPos.current,
        animated: false, // animated:false keeps it pixel-smooth (no spring easing per frame)
      });
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, [bestDeals.length, width]);

  // Category marquee: gentle pixel ticker at ~20 px/s, seamless by doubling the list
  useEffect(() => {
    if (categories.length <= 1) return;
    const CAT_CARD_W = 130 + 12; // card width + gap
    const halfTotal = CAT_CARD_W * categories.length;
    const STEP = 1;
    const INTERVAL_MS = 50; // 20 px/s — slow and gentle glide

    const timer = setInterval(() => {
      if (isUserScrollingCat.current) return;
      catScrollPos.current += STEP;
      if (catScrollPos.current >= halfTotal) {
        catScrollPos.current = 0;
        catScrollRef.current?.scrollTo({ x: 0, animated: false });
        return;
      }
      catScrollRef.current?.scrollTo({ x: catScrollPos.current, animated: false });
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, [categories.length]);

  return (
    <ScreenShell>
      <StoreNoticeBanner />
      <DeliveryNoticeBanner />
      <FestivalGreetingModal />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={refreshControl}
      >
        {/* Auto-Slide Pure Photography Hero Banner (Dynamic Mobile 16:9 Screen Ratio) */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => router.push("/(tabs)/shop")}
          style={{
            marginHorizontal: 16,
            marginTop: 8,
            marginBottom: 22,
            borderRadius: 14,
            overflow: "hidden",
            position: "relative",
            height: Math.round((width - 32) * (9 / 16)),
            backgroundColor: "#000",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <Image
            source={{ uri: HERO_SLIDES[activeHeroSlide].image }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />

          {/* Minimal Floating Indicator Dots */}
          <View
            style={{
              position: "absolute",
              bottom: 12,
              left: 0,
              right: 0,
              flexDirection: "row",
              gap: 6,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {HERO_SLIDES.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setActiveHeroSlide(i)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  width: i === activeHeroSlide ? 22 : 6,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: i === activeHeroSlide ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </View>
        </TouchableOpacity>

        {/* ADMIN ONLY — Store Insights / BI dashboard.
            Customers never see sales data. Gated by role. */}
        {isAdmin && stats ? (
          <View style={styles.insightsCard}>
            <View style={styles.insightsHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <TrendingUp size={16} color={colors.indigo} />
                <Text style={styles.insightsTitle}>STORE INSIGHTS · ADMIN</Text>
              </View>
              <View style={[styles.modePill, { backgroundColor: stats.mode === "live" ? colors.emeraldLight : colors.amberLight }]}>
                <Text style={[styles.modePillText, { color: stats.mode === "live" ? colors.emerald : colors.amber }]}>
                  {stats.mode === "live" ? "LIVE · deencommerce.com" : "SEED"}
                </Text>
              </View>
            </View>

            {/* KPI row */}
            <View style={styles.kpiRow}>
              <KpiTile label="Products" value={String(stats.store.totalProducts)} sub="in catalog" accent={colors.indigo} />
              <KpiTile label="On Sale" value={String(stats.store.onSale)} sub={`${Math.round((stats.store.onSale / (stats.store.totalProducts || 1)) * 100)}% off`} accent={colors.crimson} />
              <KpiTile label="Avg Price" value={bdt(stats.store.avgPrice)} sub="per item" accent={colors.denimStitch} />
            </View>

            {/* Sales sparkline */}
            <View style={styles.block}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>SALES · {stats.sales.period}</Text>
                <Text style={styles.blockValue}>{bdt(stats.sales.totalSales)}</Text>
              </View>
              <Sparkline data={salesSeries} width={width - 64} height={56} color={colors.indigo} />
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
                  color={colors.emerald}
                />
              </View>
            </View>

            {stats.topSellers.length > 0 && (
              <>
                <View style={styles.blockDivider} />
                <Text style={styles.blockTitle}>TOP DEALS THIS MONTH</Text>
                {stats.topSellers.slice(0, 3).map((t, i) => (
                  <View key={i} style={styles.topRow}>
                    <View style={[styles.topRank, { backgroundColor: i === 0 ? colors.denimStitch : colors.cardSecondary }]}>
                      <Text style={[styles.topRankText, { color: i === 0 ? "#fff" : colors.sub }]}>{i + 1}</Text>
                    </View>
                    <Text style={styles.topName} numberOfLines={1}>{t.name}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Direct Link to Dedicated Admin BI Page */}
            <TouchableOpacity
              style={[styles.quickBroadcastBtn, { backgroundColor: colors.indigo, marginBottom: 8 }]}
              activeOpacity={0.88}
              onPress={() => router.push("/admin")}
            >
              <Sparkles size={14} color="#FFFFFF" />
              <Text style={styles.quickBroadcastText}>📊 OPEN DEDICATED ADMIN BI DASHBOARD →</Text>
            </TouchableOpacity>

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
        <SectionHeader
          title="EXPLORE COLLECTIONS"
          subtitle="Tailored menswear crafted in Bangladesh"
          actionText="All Items →"
          onActionPress={() => router.push("/(tabs)/shop")}
        />

        <ScrollView
          ref={catScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          contentContainerStyle={styles.categoryCardScroll}
          onScrollBeginDrag={() => { isUserScrollingCat.current = true; }}
          onScrollEndDrag={() => { setTimeout(() => { isUserScrollingCat.current = false; }, 2000); }}
          onMomentumScrollEnd={(e) => {
            catScrollPos.current = e.nativeEvent.contentOffset.x;
            setTimeout(() => { isUserScrollingCat.current = false; }, 1000);
          }}
        >
          {/* Doubled for seamless infinite loop */}
          {[...categories, ...categories].map((cat, idx) => {
            const info = getCategoryInfo(cat);
            const count = products.filter((p) => p.category.toUpperCase() === cat.toUpperCase()).length;
            return (
              <TouchableOpacity
                key={`${cat}-${idx}`}
                style={styles.catCard}
                activeOpacity={0.88}
                onPress={() => handleCategoryPress(cat)}
              >
                <Image source={{ uri: info.coverImage }} style={styles.catCardImage} resizeMode="cover" />
                <View style={styles.catCardOverlay} />
                <View style={styles.catCardContent}>
                  {info.badge && (
                    <View style={styles.catCardBadge}>
                      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#10B981", marginRight: 4 }} />
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

        {/* Best Sellers & High Demand */}
        {bestDeals.length > 0 && (
          <>
            <SectionHeader
              title="BEST SELLERS & HIGH DEMAND"
              subtitle="Hot picks & highest demand pieces live right now"
              actionText="View All"
              onActionPress={() => router.push("/(tabs)/shop")}
            />
            <ScrollView
              ref={bestSellerScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              contentContainerStyle={styles.horizontalProductList}
              onScrollBeginDrag={() => {
                isUserScrollingBestSellers.current = true;
              }}
              onScrollEndDrag={() => {
                setTimeout(() => {
                  isUserScrollingBestSellers.current = false;
                }, 2000);
              }}
              onMomentumScrollEnd={(e) => {
                bestSellerScrollPos.current = e.nativeEvent.contentOffset.x;
                setTimeout(() => {
                  isUserScrollingBestSellers.current = false;
                }, 1000);
              }}
            >
              {/* Render list twice for seamless infinite loop */}
              {[...bestDeals, ...bestDeals].map((product, idx) => (
                <View key={`${product.id}-${idx}`} style={styles.horizontalCardWrapper}>
                  <ProductCard product={product} />
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* New Drops Carousel */}
        <SectionHeader
          title="NEW & TRENDING"
          subtitle="Fresh denim cuts & heritage kurta silhouettes"
          actionText="View All"
          onActionPress={() => router.push("/(tabs)/shop")}
        />

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

        {/* Section Offer Banner 1: Selvedge Denim Campaign */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: "/category/[slug]", params: { slug: "JEANS" } })}
          style={{ marginHorizontal: 16, marginVertical: 12, borderRadius: 12, overflow: "hidden", height: 160, backgroundColor: "#000" }}
        >
          <Image
            source={{ uri: "https://deencommerce.com/wp-content/uploads/2026/08/Section-image.jpg" }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Denim Masterpieces */}
        <SectionHeader
          title="SIGNATURE DENIM"
          subtitle="100% Cotton Selvedge & Comfort Stretch Jeans"
          actionText="All Jeans →"
          onActionPress={() => router.push({ pathname: "/category/[slug]", params: { slug: "JEANS" } })}
        />

        <View style={styles.grid}>
          {jeansCollection.map((product) => (
            <View key={product.id} style={styles.gridItem}>
              <ProductCard product={product} />
            </View>
          ))}
        </View>

        {/* Section Offer Banner 2: Summer Resort Shirts */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: "/category/[slug]", params: { slug: "SHIRT" } })}
          style={{ marginHorizontal: 16, marginVertical: 12, borderRadius: 12, overflow: "hidden", height: 160, backgroundColor: "#000" }}
        >
          <Image
            source={{ uri: "https://deencommerce.com/wp-content/uploads/2026/06/Shirt-Section-Image.png" }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Heritage Panjabi Section */}
        <SectionHeader
          title="HERITAGE PANJABI & KURTA"
          subtitle="Indigo dyed pure dobby cottons"
          actionText="All Panjabis →"
          onActionPress={() => router.push({ pathname: "/category/[slug]", params: { slug: "PANJABI" } })}
        />

        <View style={styles.grid}>
          {heritagePanjabi.map((product) => (
            <View key={product.id} style={styles.gridItem}>
              <ProductCard product={product} />
            </View>
          ))}
        </View>

        {/* Section Offer Banner 3: Casual Summer Drop */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: "/category/[slug]", params: { slug: "T-SHIRT" } })}
          style={{ marginHorizontal: 16, marginVertical: 12, borderRadius: 12, overflow: "hidden", height: 160, backgroundColor: "#000" }}
        >
          <Image
            source={{ uri: "https://deencommerce.com/wp-content/uploads/2026/06/Half-sleeve-Section-iomage.webp" }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Brand Authenticity Footer Card */}
        <View style={styles.brandTrustCard}>
          <View style={styles.trustItem}>
            <Award size={20} color={colors.indigo} />
            <Text style={styles.trustTitle}>Authentic Quality</Text>
            <Text style={styles.trustDesc}>Pre-shrunk premium indigo textiles with guaranteed dye-fastness.</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
            <ShieldCheck size={20} color={colors.emerald} />
            <Text style={styles.trustTitle}>e-CAB Registered</Text>
            <Text style={styles.trustDesc}>Trusted e-commerce brand with official registration & COD nationwide.</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
            <MapPin size={20} color={colors.crimson} />
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
    </ScreenShell>
  );
}

const createStyles = (colors: ThemeColors, s: ReturnType<typeof sharedStyles>) => StyleSheet.create({
  scrollContent: { ...s.scrollContent, paddingBottom: 24 },
  heroWrapper: {
    marginHorizontal: 16, marginTop: 8, marginBottom: 16, height: 380,
    borderRadius: 12, overflow: "hidden", backgroundColor: colors.indigoDark, position: "relative",
  },
  heroImage: { width: "100%", height: "100%", opacity: 0.65 },
  heroOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0, padding: 20,
    justifyContent: "flex-end", backgroundColor: "rgba(21, 26, 44, 0.45)",
  },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.denimStitch,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: "flex-start", marginBottom: 8,
  },
  heroBadgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  heroTagline: { fontSize: 14, color: colors.amberLight, fontWeight: "700", marginBottom: 4 },
  heroTitle: { fontSize: 22, fontWeight: "900", color: "#FFFFFF", letterSpacing: 0.5, lineHeight: 28, marginBottom: 6 },
  heroSub: { fontSize: 12, color: "#E2E8F0", lineHeight: 18, marginBottom: 14 },
  heroBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.indigo,
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, alignSelf: "flex-start",
    borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.2)",
  },
  heroBtnText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  categoryCardScroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  catCard: {
    width: 140,
    height: 180,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: colors.indigoDark,
    position: "relative",
  },
  catCardImage: {
    width: "100%",
    height: "100%",
  },
  catCardOverlay: {
    ...StyleSheet.absoluteFill,
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
    backgroundColor: colors.indigo,
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
    backgroundColor: colors.card, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
  },
  categoryChipText: { fontSize: 11, fontWeight: "700", color: colors.ink, letterSpacing: 0.5 },
  horizontalProductList: { paddingHorizontal: 16, gap: 12 },
  horizontalCardWrapper: { width: width * 0.46 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, justifyContent: "space-between" },
  gridItem: { width: "48%" },
  brandTrustCard: {
    backgroundColor: colors.card, borderRadius: 10, marginHorizontal: 16, marginTop: 20,
    padding: 16, borderWidth: 1, borderColor: colors.border,
  },
  trustItem: { paddingVertical: 8 },
  trustTitle: { fontSize: 13, fontWeight: "700", color: colors.ink, marginTop: 4, marginBottom: 2 },
  trustDesc: { fontSize: 11, color: colors.sub, lineHeight: 16 },
  trustDivider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 4 },
  // insights
  loadingCard: { margin: 16, padding: 24, alignItems: "center", backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  loadingText: { marginTop: 8, fontSize: 12, color: colors.sub },
  insightsCard: {
    margin: 16, backgroundColor: colors.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  insightsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  insightsTitle: { fontSize: 14, fontWeight: "900", color: colors.ink, letterSpacing: 0.6 },
  modePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  modePillText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  kpiRow: { flexDirection: "row", gap: 8 },
  block: { marginTop: 14 },
  blockHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 },
  blockTitle: { fontSize: 11, fontWeight: "800", color: colors.sub, letterSpacing: 0.6, textTransform: "uppercase" },
  blockValue: { fontSize: 15, fontWeight: "900", color: colors.indigoDark },
  blockFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  footText: { fontSize: 10, color: colors.sub },
  blockDivider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 14 },
  splitRow: { flexDirection: "row", alignItems: "center" },
  splitLeft: { flex: 1 },
  splitRight: { width: 96, alignItems: "center" },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  topRank: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  topRankText: { fontSize: 11, fontWeight: "800" },
  topName: { flex: 1, fontSize: 12, fontWeight: "600", color: colors.ink },
  quickBroadcastBtn: {
    backgroundColor: colors.indigo,
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
