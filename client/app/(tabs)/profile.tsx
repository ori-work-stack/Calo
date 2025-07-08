import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/src/store";
import { signOut } from "@/src/store/authSlice";
import { Ionicons } from "@expo/vector-icons";
import LanguageSelector from "@/components/LanguageSelector";
import EditProfile from "@/components/EditProfile";
import NotificationSettings from "@/components/NotificationSettings";
import PrivacySettings from "@/components/PrivacySettings";

type ModalType = "editProfile" | "notifications" | "privacy" | null;

export default function Profile() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const handleSignout = () => {
    Alert.alert(t("profile.Signout"), t("profile.SignoutConfirmation"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("profile.Signout"),
        style: "destructive",
        onPress: () => dispatch(signOut()),
      },
    ]);
  };

  const profileOptions = [
    {
      title: t("profile.editProfile"),
      icon: "person-outline",
      onPress: () => setActiveModal("editProfile"),
    },
    {
      title: t("profile.notifications"),
      icon: "notifications-outline",
      onPress: () => setActiveModal("notifications"),
    },
    {
      title: t("profile.privacy"),
      icon: "shield-outline",
      onPress: () => setActiveModal("privacy"),
    },
    {
      title: t("profile.support"),
      icon: "help-circle-outline",
      onPress: () => console.log("Support"),
    },
    {
      title: t("profile.about"),
      icon: "information-circle-outline",
      onPress: () => console.log("About"),
    },
  ];

  const renderModal = () => {
    switch (activeModal) {
      case "editProfile":
        return (
          <Modal
            animationType="slide"
            transparent={false}
            visible={true}
            onRequestClose={() => setActiveModal(null)}
          >
            <EditProfile onClose={() => setActiveModal(null)} />
          </Modal>
        );
      case "notifications":
        return (
          <Modal
            animationType="slide"
            transparent={false}
            visible={true}
            onRequestClose={() => setActiveModal(null)}
          >
            <NotificationSettings onClose={() => setActiveModal(null)} />
          </Modal>
        );
      case "privacy":
        return (
          <Modal
            animationType="slide"
            transparent={false}
            visible={true}
            onRequestClose={() => setActiveModal(null)}
          >
            <PrivacySettings onClose={() => setActiveModal(null)} />
          </Modal>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, isRTL && styles.containerRTL]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            {t("profile.title")}
          </Text>
        </View>

        {/* User Info */}
        <View style={[styles.userSection, isRTL && styles.userSectionRTL]}>
          <Image
            source={{
              uri: user?.avatar || "https://via.placeholder.com/80",
            }}
            style={styles.avatar}
          />
          <View style={[styles.userInfo, isRTL && styles.userInfoRTL]}>
            <Text style={[styles.userName, isRTL && styles.userNameRTL]}>
              {user?.name || "User Name"}
            </Text>
            <Text style={[styles.userEmail, isRTL && styles.userEmailRTL]}>
              {user?.email || "user@example.com"}
            </Text>
          </View>
        </View>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
            {t("profile.settings")}
          </Text>
          <LanguageSelector />
        </View>

        {/* Profile Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
            {t("profile.personalInfo")}
          </Text>
          {profileOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.optionButton, isRTL && styles.optionButtonRTL]}
              onPress={option.onPress}
            >
              <View
                style={[styles.optionContent, isRTL && styles.optionContentRTL]}
              >
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color="#666"
                  style={[styles.optionIcon, isRTL && styles.optionIconRTL]}
                />
                <Text
                  style={[styles.optionText, isRTL && styles.optionTextRTL]}
                >
                  {option.title}
                </Text>
              </View>
              <Ionicons
                name={isRTL ? "chevron-back" : "chevron-forward"}
                size={16}
                color="#666"
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Signout Button */}
        <TouchableOpacity style={styles.SignoutButton} onPress={handleSignout}>
          <Ionicons name="log-out-outline" size={20} color="#ff4444" />
          <Text style={[styles.SignoutText, isRTL && styles.SignoutTextRTL]}>
            {t("profile.Signout")}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {renderModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  containerRTL: {
    direction: "rtl",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerRTL: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  titleRTL: {
    textAlign: "right",
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    marginTop: 8,
  },
  userSectionRTL: {
    flexDirection: "row-reverse",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e9ecef",
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userInfoRTL: {
    marginLeft: 0,
    marginRight: 16,
    alignItems: "flex-end",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userNameRTL: {
    textAlign: "right",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  userEmailRTL: {
    textAlign: "right",
  },
  section: {
    marginTop: 8,
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  sectionTitleRTL: {
    textAlign: "right",
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f4",
  },
  optionButtonRTL: {
    flexDirection: "row-reverse",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionContentRTL: {
    flexDirection: "row-reverse",
  },
  optionIcon: {
    marginRight: 12,
  },
  optionIconRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  optionTextRTL: {
    textAlign: "right",
  },
  SignoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ff4444",
  },
  SignoutText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#ff4444",
    fontWeight: "500",
  },
  SignoutTextRTL: {
    marginLeft: 0,
    marginRight: 8,
  },
});
