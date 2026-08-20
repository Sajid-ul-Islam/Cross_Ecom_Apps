import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight, Sparkles, ShieldCheck, MapPin, Award } from "lucide-react-native";
import { Header } from "../../src/components/Header";
import { FreeTeeBanner, DeliveryNoticeBanner } from "../../src/components/Banner";
import { ProductCard } from "../../src/components/ProductCard";
import { Colors } from "../../src/theme/colors";
import { fetchProducts, CATEGORIES } from "../../src/services/api";
import { Product, DeenCategory } from "../../src/types";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  const newDrops = products.filter((p) => p.isNew || p.id === "dn-01" || p.id === "dn-03");
  const jeansCollection = products.filter((p) => p.category === "JEANS");
  const festivePanjabi = products.filter((p) => p.category === "PANJABI");

  const handleCategoryPress = (cat: DeenCategory) => {
    router.push({
      pathname: "/(tabs)/shop",
      params: { category: cat },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header />
      <DeliveryNoticeBanner />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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

        {/* Categories Bar */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SHOP BY CATEGORY</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/shop")}>
            <Text style={styles.seeAllText}>All Categories →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.filter((c) => c !== "ALL").map((cat) => (
            <TouchableOpacity
              key={cat}
              style={styles.categoryChip}
              activeOpacity={0.7}
              onPress={() => handleCategoryPress(cat)}
            >
              <Text style={styles.categoryChipText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* New Drops Carousel */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>NEW RELEASES</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroWrapper: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    height: 380,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.indigoDark,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    opacity: 0.65,
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    justifyContent: "flex-end",
    backgroundColor: "rgba(21, 26, 44, 0.45)",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.denimStitch,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTagline: {
    fontSize: 14,
    color: Colors.amberLight,
    fontWeight: "700",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    lineHeight: 28,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12,
    color: "#E2E8F0",
    lineHeight: 18,
    marginBottom: 14,
  },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.indigo,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  heroBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.ink,
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.sub,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 12,
    color: Colors.indigo,
    fontWeight: "700",
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  categoryChip: {
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
    letterSpacing: 0.5,
  },
  horizontalProductList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  horizontalCardWrapper: {
    width: width * 0.46,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
  },
  brandTrustCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trustItem: {
    paddingVertical: 8,
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.ink,
    marginTop: 4,
    marginBottom: 2,
  },
  trustDesc: {
    fontSize: 11,
    color: Colors.sub,
    lineHeight: 16,
  },
  trustDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
});
