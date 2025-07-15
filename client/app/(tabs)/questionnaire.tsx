import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export default function QuestionnaireTabScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/questionnaire");
    }, 100); // Very short delay to show loading

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4ECDC4" />
      <Text style={styles.loadingText}>
        {t("common.loading") || "Loading questionnaire..."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
