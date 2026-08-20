import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, X, SlidersHorizontal } from "lucide-react-native";
import { Header } from "../../src/components/Header";
import { ProductCard } from "../../src/components/ProductCard";
import { Colors } from "../../src/theme/colors";
import { fetchProducts, CATEGORIES } from "../../src/services/api";
import { Product, DeenCategory } from "../../src/types";

export default function ShopScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const [selectedCategory, setSelectedCategory] = useState<DeenCategory>(
    (params.category as DeenCategory) || "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.category && params.category !== selectedCategory) {
      setSelectedCategory(params.category as DeenCategory);
    }
  }, [params.category]);

  useEffect(() => {
    setLoading(true);
    fetchProducts(selectedCategory, searchQuery)
      .then((data) => setProducts(data))
      .finally(() => setLoading(false));
  }, [selectedCategory, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header title="CATALOG" showSearch={false} />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.sub} />
          <TextInput
            style={styles.input}
            placeholder="Search jeans, panjabi, shirts, fabric..."
            placeholderTextColor={Colors.faint}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color={Colors.sub} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.categoriesContainer}>
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
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                activeOpacity={0.75}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Header with Result Count */}
      <View style={styles.metaRow}>
        <Text style={styles.resultCount}>
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
            <Text style={styles.clearBtnText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Products Grid or Loading */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.indigo} />
          <Text style={styles.loadingText}>Fetching DEEN catalog...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySub}>
            Try changing your search terms or selecting another category.
          </Text>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              setSelectedCategory("ALL");
              setSearchQuery("");
            }}
          >
            <Text style={styles.resetBtnText}>SHOW ALL PRODUCTS</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.grid}>
            {products.map((product) => (
              <View key={product.id} style={styles.gridItem}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.paper,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: Colors.ink,
    height: "100%",
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.indigoDark,
    borderColor: Colors.indigoDark,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.sub,
    letterSpacing: 0.5,
  },
  categoryChipTextActive: {
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
    color: Colors.sub,
    letterSpacing: 1,
  },
  clearBtn: {
    paddingVertical: 2,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.crimson,
  },
  scrollContent: {
    paddingBottom: 24,
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.sub,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.ink,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.sub,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 8,
  },
  resetBtn: {
    backgroundColor: Colors.indigo,
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
});
