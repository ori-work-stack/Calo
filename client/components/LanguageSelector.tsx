import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { Ionicons } from "@expo/vector-icons";

interface LanguageSelectorProps {
  showModal?: boolean;
  onToggleModal?: () => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  showModal = false,
  onToggleModal,
}) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, isRTL } = useLanguage();
  const [modalVisible, setModalVisible] = React.useState(false);

  const languages = [
    { code: "en", name: t("language.english"), flag: "🇺🇸" },
    { code: "he", name: t("language.hebrew"), flag: "🇮🇱" },
  ];

  const handleLanguageSelect = async (languageCode: string) => {
    await changeLanguage(languageCode);
    setModalVisible(false);
    onToggleModal?.();
  };

  const toggleModal = () => {
    if (onToggleModal) {
      onToggleModal();
    } else {
      setModalVisible(!modalVisible);
    }
  };

  const isVisible = showModal || modalVisible;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.languageButton, isRTL && styles.languageButtonRTL]}
        onPress={toggleModal}
      >
        <Ionicons name="language" size={20} color="#007AFF" />
        <Text style={[styles.languageText, isRTL && styles.languageTextRTL]}>
          {languages.find((lang) => lang.code === currentLanguage)?.flag}{" "}
          {t("profile.language")}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#666" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={toggleModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isRTL && styles.modalContentRTL]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isRTL && styles.modalTitleRTL]}>
                {t("language.select")}
              </Text>
              <TouchableOpacity
                onPress={toggleModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  currentLanguage === language.code && styles.selectedLanguage,
                  isRTL && styles.languageOptionRTL,
                ]}
                onPress={() => handleLanguageSelect(language.code)}
              >
                <View
                  style={[styles.languageInfo, isRTL && styles.languageInfoRTL]}
                >
                  <Text style={styles.flag}>{language.flag}</Text>
                  <Text
                    style={[
                      styles.languageName,
                      isRTL && styles.languageNameRTL,
                    ]}
                  >
                    {language.name}
                  </Text>
                </View>
                {currentLanguage === language.code && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  languageButtonRTL: {
    flexDirection: "row-reverse",
  },
  languageText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  languageTextRTL: {
    marginLeft: 0,
    marginRight: 8,
    textAlign: "right",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 300,
  },
  modalContentRTL: {
    alignItems: "flex-end",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalTitleRTL: {
    textAlign: "right",
  },
  closeButton: {
    padding: 4,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  languageOptionRTL: {
    flexDirection: "row-reverse",
  },
  selectedLanguage: {
    backgroundColor: "#e3f2fd",
  },
  languageInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageInfoRTL: {
    flexDirection: "row-reverse",
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    color: "#333",
  },
  languageNameRTL: {
    marginRight: 0,
    marginLeft: 12,
    textAlign: "right",
  },
});

export default LanguageSelector;
