import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { Ionicons } from "@expo/vector-icons";

interface Plan {
  id: string;
  nameKey: string;
  price: string;
  features: string[];
}

export default function PaymentPlanScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<string>("free");
  const [isLoading, setIsLoading] = useState(false);

  const plans: Plan[] = [
    {
      id: "free",
      nameKey: "paymentPlan.free",
      price: "$0",
      features: ["Basic meal tracking", "Simple statistics", "Basic support"],
    },
    {
      id: "premium",
      nameKey: "paymentPlan.premium",
      price: "$9.99/month",
      features: [
        "Advanced analytics",
        "Personalized meal plans",
        "Priority support",
        "AI recommendations",
      ],
    },
    {
      id: "gold",
      nameKey: "paymentPlan.gold",
      price: "$19.99/month",
      features: [
        "Everything in Premium",
        "Nutritionist consultations",
        "24/7 support",
        "Custom meal plans",
      ],
    },
  ];

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlan = (plan: Plan) => (
    <TouchableOpacity
      key={plan.id}
      style={[
        styles.planCard,
        selectedPlan === plan.id && styles.selectedPlan,
        isRTL && styles.planCardRTL,
      ]}
      onPress={() => setSelectedPlan(plan.id)}
      disabled={isLoading}
    >
      <View style={[styles.planHeader, isRTL && styles.planHeaderRTL]}>
        <Text style={[styles.planName, isRTL && styles.planNameRTL]}>
          {t(plan.nameKey)}
        </Text>
        <Text style={[styles.planPrice, isRTL && styles.planPriceRTL]}>
          {plan.price}
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        <Text style={[styles.featuresTitle, isRTL && styles.featuresTitleRTL]}>
          {t("paymentPlan.features")}:
        </Text>
        {plan.features.map((feature, index) => (
          <View
            key={index}
            style={[styles.featureRow, isRTL && styles.featureRowRTL]}
          >
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={[styles.featureText, isRTL && styles.featureTextRTL]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {selectedPlan === plan.id && (
        <View
          style={[
            styles.selectedIndicator,
            isRTL && styles.selectedIndicatorRTL,
          ]}
        >
          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
          <Text style={[styles.selectedText, isRTL && styles.selectedTextRTL]}>
            {t("paymentPlan.currentPlan")}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, isRTL && styles.containerRTL]}>
      <View style={styles.header}>
        <Text style={[styles.title, isRTL && styles.titleRTL]}>
          {t("paymentPlan.title")}
        </Text>
      </View>

      <View style={styles.plansContainer}>{plans.map(renderPlan)}</View>

      <TouchableOpacity
        style={[styles.continueButton, isLoading && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.continueButtonText}>{t("common.continue")}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  containerRTL: {
    direction: "rtl",
  },
  header: {
    marginTop: 60,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  titleRTL: {
    textAlign: "center",
  },
  plansContainer: {
    flex: 1,
    marginBottom: 20,
  },
  planCard: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  planCardRTL: {
    alignItems: "flex-end",
  },
  selectedPlan: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  planHeaderRTL: {
    flexDirection: "row-reverse",
  },
  planName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  planNameRTL: {
    textAlign: "right",
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007AFF",
  },
  planPriceRTL: {
    textAlign: "left",
  },
  featuresContainer: {
    marginBottom: 12,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  featuresTitleRTL: {
    textAlign: "right",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  featureRowRTL: {
    flexDirection: "row-reverse",
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  featureTextRTL: {
    marginLeft: 0,
    marginRight: 8,
    textAlign: "right",
  },
  selectedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  selectedIndicatorRTL: {
    flexDirection: "row-reverse",
  },
  selectedText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  selectedTextRTL: {
    marginLeft: 0,
    marginRight: 8,
  },
  continueButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
