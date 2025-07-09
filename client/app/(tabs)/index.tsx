import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <ScrollView style={[styles.container, isRTL && styles.containerRTL]}>
      <View style={styles.header}>
        <Text style={[styles.title, isRTL && styles.titleRTL]}>
          {t("common.welcome")}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
          {t("common.quickActions")}
        </Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="restaurant" size={32} color="#007AFF" />
            <Text style={[styles.actionText, isRTL && styles.actionTextRTL]}>
              {t("meals.logMeal")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="camera" size={32} color="#007AFF" />
            <Text style={[styles.actionText, isRTL && styles.actionTextRTL]}>
              {t("camera.scanFood")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
          {t("common.recentActivity")}
        </Text>
        <Text style={[styles.noActivity, isRTL && styles.noActivityRTL]}>
          {t("common.noRecentActivity")}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  containerRTL: {
    direction: "rtl",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  titleRTL: {
    textAlign: "right",
  },
  section: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  sectionTitleRTL: {
    textAlign: "right",
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionCard: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    width: "45%",
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  actionTextRTL: {
    textAlign: "center",
  },
  noActivity: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    padding: 20,
  },
  noActivityRTL: {
    textAlign: "center",
  },
});
