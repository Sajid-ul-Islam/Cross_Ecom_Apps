import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
} from "react-native";
import { X, Star, CheckCircle2, Camera, ShieldCheck, User } from "./Icons";
import { Colors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { Product } from "../types";

const { width, height } = Dimensions.get("window");

interface ReviewItem {
  id: string;
  name: string;
  rating: number;
  date: string;
  fitInfo: string;
  purchasedSize: string;
  comment: string;
  images: string[];
}

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: "rev_1",
    name: "Names",
    rating: 5,
    date: "2 days ago",
    fitInfo: "Height: 5'10\" · Weight: 72kg",
    purchasedSize: "Size 32",
    comment:
      "Incredible 13.5 oz Japanese-grade denim! The selvedge ID line is super clean and the zero-torque yarn gives it a structured drape. Sized up by 1 inch as recommended for raw denim.",
    images: [
      "https://image.qwenlm.ai/generated-images/79c9339e-d306-4444-aee3-bc6da2b12cf3/_result.png",
      "https://image.qwenlm.ai/generated-images/17924dca-20ea-46df-bf74-0f2c41872df8/_result.png",
    ],
  },
  {
    id: "rev_2",
    name: "Mahmudur Rahman",
    rating: 5,
    date: "1 week ago",
    fitInfo: "Height: 6'0\" · Weight: 78kg",
    purchasedSize: "Size 34",
    comment:
      "Best menswear investment in Dhaka. Delivery took only 18 hours with Dhaka Express. Stitching on the pockets and rivets are top notch.",
    images: [
      "https://image.qwenlm.ai/generated-images/d73b64c1-f3b3-4f96-857c-880c1074e0d4/_result.png",
    ],
  },
];

interface ProductReviewsModalProps {
  visible: boolean;
  product: Product;
  onClose: () => void;
}

export const ProductReviewsModal: React.FC<ProductReviewsModalProps> = ({
  visible,
  product,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [userName, setUserName] = useState("Sajid");
  const [userRating, setUserRating] = useState(5);
  const [fitHeight, setFitHeight] = useState("5'11\"");
  const [fitWeight, setFitWeight] = useState("74kg");
  const [reviewText, setReviewText] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([
    "https://image.qwenlm.ai/generated-images/79c9339e-d306-4444-aee3-bc6da2b12cf3/_result.png",
  ]);

  const handleSubmitReview = () => {
    if (!reviewText.trim()) {
      Alert.alert("Review Required", "Please share a few words about your experience with this garment.");
      return;
    }

    const newRev: ReviewItem = {
      id: `rev_${Date.now()}`,
      name: userName || "Verified Shopper",
      rating: userRating,
      date: "Just now",
      fitInfo: `Height: ${fitHeight} · Weight: ${fitWeight}`,
      purchasedSize: product.sizes[0] || "Standard",
      comment: reviewText.trim(),
      images: selectedPhotos,
    };

    setReviews([newRev, ...reviews]);
    setShowWriteForm(false);
    setReviewText("");
    Alert.alert("Review Posted! ⭐", "Thank you for contributing verified fit feedback for the DEEN community.");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.paper }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: colors.amber }]}>
                <Star size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.ink }]}>VERIFIED REVIEWS & FIT PHOTOS</Text>
                <Text style={[styles.subtitle, { color: colors.sub }]}>{product.name}</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.cardSecondary }]} onPress={onClose}>
              <X size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Rating Overview Card */}
            <View style={styles.ratingSummaryCard}>
              <View style={styles.ratingScoreBox}>
                <Text style={styles.scoreNumber}>{product.rating || "4.9"}</Text>
                <View style={{ flexDirection: "row", gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} color={colors.amber} />
                  ))}
                </View>
                <Text style={styles.scoreSub}>Based on {reviews.length + 18} verified orders</Text>
              </View>

              <View style={styles.fitStatsBox}>
                <Text style={styles.fitStatsTitle}>FIT PROFILE ACCURACY:</Text>
                <Text style={styles.fitStatItem}>• True to Size: <Text style={styles.bold}>92%</Text></Text>
                <Text style={styles.fitStatItem}>• Snug on Waist (Raw): <Text style={styles.bold}>8%</Text></Text>
                <Text style={styles.fitStatItem}>• Fabric Quality: <Text style={styles.bold}>⭐ 5.0 / 5.0</Text></Text>
              </View>
            </View>

            {/* Write Review Trigger */}
            {!showWriteForm ? (
              <TouchableOpacity
                style={styles.writeReviewBtn}
                activeOpacity={0.88}
                onPress={() => setShowWriteForm(true)}
              >
                <Star size={16} color="#FFFFFF" />
                <Text style={styles.writeReviewBtnText}>WRITE A VERIFIED REVIEW</Text>
              </TouchableOpacity>
            ) : (
              /* Review Form */
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>POST YOUR VERIFIED FIT REVIEW</Text>

                <View style={styles.starSelectRow}>
                  <Text style={styles.fieldLabel}>Rating:</Text>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <TouchableOpacity key={s} onPress={() => setUserRating(s)}>
                        <Star size={24} color={s <= userRating ? colors.amber : colors.border} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.rowFields}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Your Height</Text>
                    <TextInput
                      style={styles.input}
                      value={fitHeight}
                      onChangeText={setFitHeight}
                      placeholder={"e.g. 5'10\""}
                      placeholderTextColor={colors.faint}
                    />
                  </View>

                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Your Weight</Text>
                    <TextInput
                      style={styles.input}
                      value={fitWeight}
                      onChangeText={setFitWeight}
                      placeholder="e.g. 72kg"
                      placeholderTextColor={colors.faint}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Fit & Craft Feedback *</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 70, textAlignVertical: "top" }]}
                    value={reviewText}
                    onChangeText={setReviewText}
                    multiline
                    numberOfLines={3}
                    placeholder="How does the garment fit? Describe the fabric texture, waistband, and styling..."
                    placeholderTextColor={colors.faint}
                  />
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowWriteForm(false)}
                  >
                    <Text style={styles.cancelBtnText}>CANCEL</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.submitRevBtn}
                    onPress={handleSubmitReview}
                  >
                    <Text style={styles.submitRevBtnText}>PUBLISH REVIEW</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Reviews List */}
            <View style={styles.reviewsList}>
              {reviews.map((rev) => (
                <View key={rev.id} style={styles.reviewCard}>
                  <View style={styles.revTop}>
                    <View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={styles.revName}>{rev.name}</Text>
                        <View style={styles.verifiedPill}>
                          <ShieldCheck size={11} color={colors.emerald} />
                          <Text style={styles.verifiedText}>VERIFIED BUYER</Text>
                        </View>
                      </View>
                      <Text style={styles.revDate}>
                        {rev.date} · Purchased {rev.purchasedSize}
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", gap: 2 }}>
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} size={12} color={colors.amber} />
                      ))}
                    </View>
                  </View>

                  <View style={styles.fitInfoBadge}>
                    <Text style={styles.fitInfoText}>📏 Fit Context: {rev.fitInfo}</Text>
                  </View>

                  <Text style={styles.revComment}>{rev.comment}</Text>

                  {/* Review Photos */}
                  {rev.images.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.revPhotosScroll}>
                      {rev.images.map((img, idx) => (
                        <Image key={idx} source={{ uri: img }} style={styles.revPhoto} resizeMode="cover" />
                      ))}
                    </ScrollView>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.92,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
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
    backgroundColor: Colors.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 13,
    fontWeight: "900",
    color: Colors.ink,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.sub,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 18,
    gap: 14,
    paddingBottom: 36,
  },
  ratingSummaryCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  ratingScoreBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 14,
    borderRightWidth: 1,
    borderRightColor: Colors.borderLight,
    gap: 4,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.ink,
  },
  scoreSub: {
    fontSize: 9,
    color: Colors.sub,
    textAlign: "center",
    maxWidth: 90,
  },
  fitStatsBox: {
    flex: 1,
    justifyContent: "center",
    gap: 3,
  },
  fitStatsTitle: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.sub,
    letterSpacing: 0.5,
  },
  fitStatItem: {
    fontSize: 11,
    color: Colors.ink,
  },
  bold: {
    fontWeight: "800",
    color: Colors.indigoDark,
  },
  writeReviewBtn: {
    backgroundColor: Colors.indigo,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  writeReviewBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  formTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: Colors.ink,
  },
  starSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  field: {
    gap: 6,
  },
  rowFields: {
    flexDirection: "row",
    gap: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.ink,
  },
  input: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: Colors.ink,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.sub,
  },
  submitRevBtn: {
    backgroundColor: Colors.indigo,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitRevBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  revTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  revName: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.ink,
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.emeraldLight,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  verifiedText: {
    color: Colors.emerald,
    fontSize: 8,
    fontWeight: "900",
  },
  revDate: {
    fontSize: 10,
    color: Colors.sub,
    marginTop: 2,
  },
  fitInfoBadge: {
    backgroundColor: Colors.paper,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fitInfoText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.indigoDark,
  },
  revComment: {
    fontSize: 12,
    color: Colors.ink,
    lineHeight: 18,
  },
  revPhotosScroll: {
    gap: 8,
    paddingTop: 4,
  },
  revPhoto: {
    width: 70,
    height: 70,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
