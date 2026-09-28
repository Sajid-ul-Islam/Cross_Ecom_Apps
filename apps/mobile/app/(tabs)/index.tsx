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
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import {
  ArrowRight,
  Sparkles,
} from "../../src/components/Icons";
import { SectionHeader } from "../../src/components/SectionHeader";
import { ScreenShell } from "../../src/components/ScreenShell";
import { DeliveryNoticeBanner } from "../../src/components/Banner";
import { StoreNoticeBanner } from "../../src/components/StoreNoticeBanner";
import { ProductCard } from "../../src/components/ProductCard";

import { ThemeColors } from "../../src/theme/colors";
import { sharedStyles } from "../../src/theme/sharedStyles";
import { useTheme } from "../../src/context/ThemeContext";
import { usePullToRefresh } from "../../src/hooks/usePullToRefresh";
import { fetchProducts, CATEGORIES, bdt, useCatalogRefreshOnFocus } from "../../src/services/gateway";
import { Product, DeenCategory } from "../../src/types";
import { useProfile } from "../../src/context/ProfileContext";
import { getCategoryInfo } from "../../src/data/categories";

import { FestivalGreetingModal } from "../../src/components/FestivalGreetingModal";
import { MotionHero } from "../../src/components/MotionHero";
import { BrandStorySection } from "../../src/components/BrandStorySection";
import { StoriesFeedModal } from "../../src/components/StoriesFeedModal";
import { NotificationOptInModal, NOTIF_OPT_IN_DISMISSED_KEY } from "../../src/components/NotificationOptInModal";
import { fetchSocialFeed, DEFAULT_SOCIAL_FEED, type SocialFeedData, fetchSectionBanners, type SectionBannerItem } from "../../src/services/gateway";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { colors, isDark } = useTheme();
  const s = sharedStyles(colors);

  const styles = createStyles(colors, s);
  const [products, setProducts] = useState<Product[]>([]);

  const [socialFeed, setSocialFeed] = useState<SocialFeedData>(DEFAULT_SOCIAL_FEED);
  const [sectionBanners, setSectionBanners] = useState<SectionBannerItem[]>([]);

  const [notifOptInVisible, setNotifOptInVisible] = useState(false);
  const [storiesVisible, setStoriesVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(NOTIF_OPT_IN_DISMISSED_KEY).then((val) => {
      if (!val) {
        const t = setTimeout(() => setNotifOptInVisible(true), 7000);
        return () => clearTimeout(t);
      }
    });
  }, []);

  const loadData = useCallback(async () => {
    try {
      const p = await fetchProducts();
      setProducts(p);
      fetchSocialFeed().then((sf) => {
        if (sf) setSocialFeed(sf);
      }).catch(() => {});
      fetchSectionBanners().then((sb) => {
        if (sb && sb.length > 0) setSectionBanners(sb);
      }).catch(() => {});
    } catch {}
  }, []);


  useCatalogRefreshOnFocus(loadData);

  useEffect(() => {
    loadData();
  }, []);

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



  const bestSellerScrollRef = React.useRef<ScrollView>(null);
  const bestSellerScrollPos = React.useRef(0);
  const isUserScrollingBestSellers = React.useRef(false);

  // --- Category marquee auto-scroll ---
  const catScrollRef = React.useRef<ScrollView>(null);
  const catScrollPos = React.useRef(0);
  const isUserScrollingCat = React.useRef(false);
  const categories = [
    "SALE",
    "TRENDING",
    "NEW_ARRIVALS",
    "JEANS",
    "SHIRT",
    "T-SHIRT",
    "TROUSERS",
    "PANJABI",
    "POLO",
    "DEEN_SELECT",
    "ACCESSORIES",
  ];

  useEffect(() => {
    if (!bestDeals || bestDeals.length <= 1) return;
    // Duplicate list renders 2× items; loop resets at the halfway mark
    const cardWidth = Math.round(width * 0.46) + 12;
    const halfTotal = cardWidth * bestDeals.length; // midpoint = 1 full copy

    // Smooth ticker: advance 1 px every 85 ms ≈ 11.7 px / s (ultra-slow & graceful glide)
    const STEP = 1;
    const INTERVAL_MS = 85;

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

  // Category marquee: gentle pixel ticker at ~12.5 px/s, seamless by doubling the list
  useEffect(() => {
    if (categories.length <= 1) return;
    const CAT_CARD_W = 130 + 12; // card width + gap
    const halfTotal = CAT_CARD_W * categories.length;
    const STEP = 1;
    const INTERVAL_MS = 80; // 12.5 px/s — slow and gentle glide

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
        {/* Interactive Motion Brand Hero Experience */}
        <MotionHero onWatchStory={() => setStoriesVisible(true)} />



        {/* Categories Showcase with Cover Images */}
        <SectionHeader
          title="SHOP BY CATEGORY"
          subtitle="Denim styles, curated drops & artisanal essentials"
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
            const isLandscape = info.orientation === "landscape";
            return (
              <TouchableOpacity
                key={`${cat}-${idx}`}
                style={isLandscape ? styles.catCardLandscape : styles.catCard}
                activeOpacity={0.88}
                onPress={() => handleCategoryPress(cat)}
              >
                <Image
                  source={{ uri: info.coverImage }}
                  style={styles.catCardImage}
                  resizeMode="cover"
                />
                <View
                  style={
                    isLandscape
                      ? [styles.catCardOverlay, { backgroundColor: "rgba(10, 15, 28, 0.65)" }]
                      : styles.catCardOverlay
                  }
                />
                <View style={styles.catCardContent}>
                  {info.badge && (
                    <View style={styles.catCardBadge}>
                      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#10B981", marginRight: 4 }} />
                      <Text style={styles.catCardBadgeText}>{info.badge}</Text>
                    </View>
                  )}
                  <Text style={styles.catCardTitle} numberOfLines={1}>
                    {info.title || info.name}
                  </Text>
                  <Text style={styles.catCardCount} numberOfLines={isLandscape ? 2 : 1}>
                    {info.subtitle}
                  </Text>
                  {isLandscape && (
                    <View style={styles.catLandscapeCta}>
                      <Text style={styles.catLandscapeCtaText}>Explore Deals →</Text>
                    </View>
                  )}
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

        {/* Section Offer Banner 1: Cross Hatch Denim Campaign */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: "/category/[slug]", params: { slug: "JEANS" } })}
          style={{ marginHorizontal: 16, marginVertical: 12, borderRadius: 12, overflow: "hidden", height: 160, backgroundColor: "#000" }}
        >
          <Image
            source={{ uri: sectionBanners[0]?.image || "https://deencommerce.com/wp-content/uploads/2026/05/DEEN-90s-Blue-Jeans-Slim-Fit-101-0100-138-front.webp" }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Denim Masterpieces */}
        <SectionHeader
          title="SIGNATURE DENIM"
          subtitle="100% Cotton Cross Hatch & Comfort Stretch Jeans"
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
            source={{ uri: sectionBanners[1]?.image || "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Flanel-Shirt-102-0302-041-Front.webp" }}
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
            source={{ uri: sectionBanners[3]?.image || "https://deencommerce.com/wp-content/uploads/2026/07/DEEN-Essential-Black-T-shirt-105-0101-380-Front.webp" }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Artisanal Heritage, Craft & Authenticity — swipeable story rail */}
        <BrandStorySection />

        {/* Authentic Payment Partner Trust Banner */}
        <View style={{ alignItems: "center", marginVertical: 18, paddingHorizontal: 16 }}>
          <Image
            source={require("../../assets/paywith.png")}
            style={{ width: width - 48, height: 26, opacity: 0.85 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 11, color: colors.sub, marginTop: 10, textAlign: "center", fontWeight: "600" }}>
            দেশের প্রথম ডেনিম ব্র্যান্ড · 100% Secure Checkout
          </Text>
        </View>
      </ScrollView>



      {/* Notification Value-First Opt-In Modal */}
      <NotificationOptInModal
        visible={notifOptInVisible}
        onClose={() => setNotifOptInVisible(false)}
      />

      {/* Shoppable Stories Modal */}
      <StoriesFeedModal
        visible={storiesVisible}
        onClose={() => setStoriesVisible(false)}
        feedData={socialFeed}
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
    width: 148,
    height: 188,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.indigoDark,
    position: "relative",
  },
  catCardLandscape: {
    width: 280,
    height: 188,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.indigoDark,
    position: "relative",
  },
  catLandscapeCta: {
    marginTop: 6,
    backgroundColor: colors.denimStitch,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  catLandscapeCtaText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "800",
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
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "48.5%", marginBottom: 10 },
  // insights
});
