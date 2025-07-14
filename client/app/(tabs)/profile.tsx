import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  StatusBar,
  Dimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import EditProfile from "@/components/EditProfile";
import NotificationSettings from "@/components/NotificationSettings";
import PrivacySettings from "@/components/PrivacySettings";
import LanguageSelector from "@/components/LanguageSelector";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/src/store";
import { signOut } from "@/src/store/authSlice";
import { router } from "expo-router";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const menuItems = [
    {
      id: "editProfile",
      title: t("profile.edit_profile"),
      icon: "person-outline",
      color: "#007AFF",
      gradient: ["#007AFF", "#0051D5"],
    },
    {
      id: "notifications",
      title: t("profile.notifications"),
      icon: "notifications-outline",
      color: "#FF9500",
      gradient: ["#FF9500", "#FF6B35"],
    },
    {
      id: "personalData",
      title: t("profile.personal_data"),
      icon: "person-circle-outline",
      color: "#FF9500",
      gradient: ["#FF9500", "#FF6B35"],
    },
    {
      id: "privacy",
      title: t("profile.privacy"),
      icon: "shield-checkmark-outline",
      color: "#34C759",
      gradient: ["#34C759", "#30BA6A"],
    },
    {
      id: "language",
      title: t("profile.language"),
      icon: "language",
      color: "#5856D6",
      gradient: ["#5856D6", "#4D4AE8"],
    },
    {
      id: "support",
      title: t("profile.support"),
      icon: "help-circle-outline",
      color: "#FF3B30",
      gradient: ["#FF3B30", "#FF4542"],
    },
    {
      id: "about",
      title: t("profile.about"),
      icon: "information-circle-outline",
      color: "#8E8E93",
      gradient: ["#8E8E93", "#6D6D7A"],
    },
  ];

  const handleMenuPress = (itemId: string) => {
    if (itemId === "language") {
      setShowLanguageModal(true);
    } else if (itemId === "personalData") {
      // Navigate to questionnaire in edit mode
      router.push("/questionnaire?mode=edit");
    } else {
      setActiveSection(activeSection === itemId ? null : itemId);
    }
  };

  const handleSignOut = () => {
    Alert.alert(t("profile.signout"), t("profile.signout_confirmation"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.signout"),
        style: "destructive",
        onPress: () => {
          dispatch(signOut());
        },
      },
    ]);
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "editProfile":
        return <EditProfile onClose={() => setActiveSection(null)} />;
      case "notifications":
        return <NotificationSettings onClose={() => setActiveSection(null)} />;
      case "privacy":
        return <PrivacySettings onClose={() => setActiveSection(null)} />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const getSubscriptionBadge = (type: string) => {
    switch (type) {
      case "PREMIUM":
        return { color: "#FFD700", text: "PREMIUM" };
      case "GOLD":
        return { color: "#FF6B35", text: "GOLD" };
      default:
        return { color: "#8E8E93", text: "FREE" };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />

      {/* Header with gradient background */}
      <View
        style={[styles.headerContainer, isRTL && styles.headerContainerRTL]}
      >
        <View style={styles.headerOverlay}>
          <View
            style={[styles.profileSection, isRTL && styles.profileSectionRTL]}
          >
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri:
                    user?.avatar ||
                    "https://via.placeholder.com/120x120/007AFF/FFFFFF?text=U",
                }}
                style={styles.avatar}
              />
              <View style={styles.onlineBadge} />
            </View>

            <View style={[styles.userInfo, isRTL && styles.userInfoRTL]}>
              <Text style={[styles.name, isRTL && styles.nameRTL]}>
                {user?.name || "User Name"}
              </Text>
              <Text style={[styles.email, isRTL && styles.emailRTL]}>
                {user?.email || "user@example.com"}
              </Text>

              <View
                style={[
                  styles.subscriptionBadge,
                  {
                    backgroundColor: getSubscriptionBadge(
                      user?.subscription_type ?? ""
                    ).color,
                  },
                ]}
              >
                <Text style={styles.subscriptionText}>
                  {getSubscriptionBadge(user?.subscription_type ?? "").text}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Stats */}
        <View
          style={[styles.statsContainer, isRTL && styles.statsContainerRTL]}
        >
          <View style={[styles.statItem, isRTL && styles.statItemRTL]}>
            <Text style={styles.statValue}>{user?.ai_requests_count || 0}</Text>
            <Text style={styles.statLabel}>AI Requests</Text>
          </View>
          <View style={[styles.statItem, isRTL && styles.statItemRTL]}>
            <Text style={styles.statValue}>
              {formatDate(user?.created_at ?? "")}
            </Text>
            <Text style={styles.statLabel}>Member Since</Text>
          </View>
          <View style={[styles.statItem, isRTL && styles.statItemRTL]}>
            <Text style={styles.statValue}>
              {user?.is_questionnaire_completed ? "✓" : "○"}
            </Text>
            <Text style={styles.statLabel}>Profile Complete</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.menuItemWrapper,
                index === menuItems.length - 1 && styles.lastMenuItem,
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  isRTL && styles.menuItemRTL,
                  activeSection === item.id && styles.menuItemActive,
                ]}
                onPress={() => handleMenuPress(item.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[styles.menuItemLeft, isRTL && styles.menuItemLeftRTL]}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: item.color },
                    ]}
                  >
                    <Ionicons name={item.icon as any} size={20} color="white" />
                  </View>
                  <Text
                    style={[
                      styles.menuItemText,
                      isRTL && styles.menuItemTextRTL,
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>
                <View
                  style={[
                    styles.menuItemRight,
                    isRTL && styles.menuItemRightRTL,
                  ]}
                >
                  <Ionicons
                    name={
                      activeSection === item.id
                        ? "chevron-up"
                        : isRTL
                        ? "chevron-back"
                        : "chevron-forward"
                    }
                    size={20}
                    color="#8E8E93"
                  />
                </View>
              </TouchableOpacity>

              {/* Render section content */}
              {activeSection === item.id && (
                <View style={styles.sectionContent}>
                  {renderSectionContent()}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Language Selector */}
        <LanguageSelector
          showModal={showLanguageModal}
          onToggleModal={() => setShowLanguageModal(!showLanguageModal)}
        />

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.signOutButton, isRTL && styles.signOutButtonRTL]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={[styles.signOutText, isRTL && styles.signOutTextRTL]}>
            {t("profile.signout")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerContainer: {
    backgroundColor: "#007AFF",
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContainerRTL: {
    // RTL specific styles can be added here if needed
  },
  headerOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profileSectionRTL: {
    flexDirection: "row-reverse",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#34C759",
    borderWidth: 2,
    borderColor: "white",
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userInfoRTL: {
    marginLeft: 0,
    marginRight: 16,
    alignItems: "flex-end",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  nameRTL: {
    textAlign: "right",
  },
  email: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  emailRTL: {
    textAlign: "right",
  },
  subscriptionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  subscriptionText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    marginTop: -15,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsContainerRTL: {
    flexDirection: "row-reverse",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statItemRTL: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  menuContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItemWrapper: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuItemRTL: {
    flexDirection: "row-reverse",
  },
  menuItemActive: {
    backgroundColor: "#f8f9fa",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemLeftRTL: {
    flexDirection: "row-reverse",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  menuItemTextRTL: {
    marginLeft: 0,
    marginRight: 16,
    textAlign: "right",
  },
  menuItemRight: {
    paddingLeft: 16,
  },
  menuItemRightRTL: {
    paddingLeft: 0,
    paddingRight: 16,
  },
  sectionContent: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  signOutButtonRTL: {
    flexDirection: "row-reverse",
  },
  signOutText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "600",
  },
  signOutTextRTL: {
    marginLeft: 0,
    marginRight: 8,
    textAlign: "right",
  },
});
