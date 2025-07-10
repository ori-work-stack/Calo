import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/src/store";
import { userAPI } from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";

type PlanType = "FREE" | "PREMIUM" | "GOLD";

interface Plan {
  id: PlanType;
  name: string;
  price: string;
  features: string[];
  color: string;
  recommended?: boolean;
}

const plans: Plan[] = [
  {
    id: "FREE",
    name: "תוכנית חינמית",
    price: "חינם",
    features: [
      "2 ניתוחי תמונות ביום",
      "תפריט תזונתי בסיסי",
      "מעקב קלוריות",
      "גישה למאגר מתכונים",
    ],
    color: "#4CAF50",
  },
  {
    id: "PREMIUM",
    name: "תוכנית פרימיום",
    price: "₪49/חודש",
    features: [
      "20 ניתוחי תמונות ביום",
      "תפריט תזונתי מותאם אישית",
      "מעקב מפורט אחר מקרו וויטמינים",
      "המלצות AI מתקדמות",
      "גישה לכל המתכונים",
      "תמיכה בצ'אט",
    ],
    color: "#2196F3",
    recommended: true,
  },
  {
    id: "GOLD",
    name: "תוכנית זהב",
    price: "₪99/חודש",
    features: [
      "50 ניתוחי תמונות ביום",
      "תפריט מותאם אישית עם AI מתקדם",
      "מעקב בריאותי מלא",
      "ייעוץ תזונתי אישי",
      "תמיכה עדיפות גבוהה",
      "גישה מוקדמת לפיצ'רים חדשים",
      "דוחות בריאות מפורטים",
    ],
    color: "#FF9800",
  },
];

export default function PaymentPlan() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handlePlanSelection = async (planId: PlanType) => {
    try {
      setIsLoading(true);
      setSelectedPlan(planId);

      const response = await userAPI.updateSubscription(planId);
      console.log(response);

      if (!response.success) {
        throw new Error(response.error || "Failed to update subscription");
      }

      dispatch({
        type: "auth/updateSubscription",
        payload: { subscription_type: planId },
      });

      if (planId === "FREE") {
        // Reset state BEFORE navigation for FREE plan
        setIsLoading(false);
        setSelectedPlan(null);
        router.push("/(tabs)");
        return; // Exit early to avoid finally block
      } else {
        // Reset state BEFORE navigation for premium plans too
        setIsLoading(false);
        setSelectedPlan(null);
        router.push("/questionnaire");
        return; // Exit early to avoid finally block
      }
    } catch (error: any) {
      console.error("Plan selection error:", error);
      Alert.alert("שגיאה", error.message || "נכשל בעדכון התוכנית");
      setIsLoading(false);
      setSelectedPlan(null);
    }
    // Remove the finally block entirely since we handle state reset above
  };

  const handleGoBack = () => {
    router.push("/signup");
  };
  
  const renderPlan = (plan: Plan) => (
    <View
      key={plan.id}
      style={[styles.planCard, plan.recommended && styles.recommendedCard]}
    >
      {plan.recommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>מומלץ</Text>
        </View>
      )}
      <Text style={styles.planName}>{plan.name}</Text>
      <Text style={[styles.planPrice, { color: plan.color }]}>
        {plan.price}
      </Text>

      <View style={styles.featuresContainer}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.selectButton,
          { backgroundColor: plan.color },
          selectedPlan === plan.id && isLoading && styles.loadingButton,
        ]}
        onPress={() => handlePlanSelection(plan.id)}
        disabled={isLoading}
        accessibilityLabel={`Select ${plan.name} plan`}
      >
        {selectedPlan === plan.id && isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.selectButtonText}> {plan.id}בחר תוכנית זו</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <TouchableOpacity onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <Text style={styles.title}>בחר את התוכנית שלך</Text>
        <Text style={styles.subtitle}>
          התחל במסע התזונתי שלך עם התוכנית המתאימה לך
        </Text>
      </View>

      <View style={styles.plansContainer}>{plans.map(renderPlan)}</View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ניתן לשנות או לבטל את המנוי בכל עת מהגדרות החשבון
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  plansContainer: {
    gap: 20,
  },
  planCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
  },
  recommendedCard: {
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  recommendedBadge: {
    position: "absolute",
    top: -10,
    right: 20,
    backgroundColor: "#2196F3",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  planName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkmark: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  selectButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  loadingButton: {
    opacity: 0.7,
  },
  selectButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 30,
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    lineHeight: 18,
  },
});
