import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../src/i18n/context/LanguageContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HelpContent {
  title: string;
  description: string;
}

interface LanguageToolbarProps {
  helpContent?: HelpContent;
}

const LanguageToolbar: React.FC<LanguageToolbarProps> = ({ helpContent }) => {
  const { language, changeLanguage, isRTL } = useLanguage();
  const [showHelp, setShowHelp] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandAnimation] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  const handleLanguageToggle = () => {
    const newLanguage = language === "he" ? "en" : "he";
    changeLanguage(newLanguage);
  };

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);

    Animated.spring(expandAnimation, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const expandedWidth = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, helpContent ? 160 : 120],
  });

  const gearRotation = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const buttonOpacity = expandAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const buttonScale = expandAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 0.8, 1],
  });

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
        isRTL && styles.containerRTL,
      ]}
    >
      <View
        style={[styles.toolbarContainer, isRTL && styles.toolbarContainerRTL]}
      >
        <Animated.View
          style={[
            styles.toolbar,
            isRTL && styles.toolbarRTL,
            { width: expandedWidth },
          ]}
        >
          {/* Gear Icon Button */}
          <TouchableOpacity
            style={[styles.gearButton, isRTL && styles.gearButtonRTL]}
            onPress={toggleExpanded}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <Animated.View style={{ transform: [{ rotate: gearRotation }] }}>
              <Ionicons
                name="settings"
                size={22}
                color="#4ECDC4"
                style={styles.gearIcon}
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Expanded Buttons */}
          <View
            style={[styles.expandedButtons, isRTL && styles.expandedButtonsRTL]}
          >
            <Animated.View
              style={[
                styles.animatedButton,
                {
                  opacity: buttonOpacity,
                  transform: [{ scale: buttonScale }],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  isRTL && styles.languageButtonRTL,
                ]}
                onPress={handleLanguageToggle}
                accessibilityLabel="Change Language"
                accessibilityRole="button"
              >
                <Text style={styles.languageText}>
                  {language === "he" ? "EN" : "עב"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {helpContent && (
              <Animated.View
                style={[
                  styles.animatedButton,
                  {
                    opacity: buttonOpacity,
                    transform: [{ scale: buttonScale }],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.helpButton, isRTL && styles.helpButtonRTL]}
                  onPress={() => setShowHelp(true)}
                  accessibilityLabel="Help"
                  accessibilityRole="button"
                >
                  <Ionicons
                    name="help-circle-outline"
                    size={18}
                    color="#4ECDC4"
                    style={styles.helpIcon}
                  />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </View>

      <Modal
        visible={showHelp}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHelp(false)}
        statusBarTranslucent={Platform.OS === "android"}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isRTL && styles.modalContentRTL]}>
            <View style={[styles.modalHeader, isRTL && styles.modalHeaderRTL]}>
              <Text style={[styles.modalTitle, isRTL && styles.modalTitleRTL]}>
                {helpContent?.title}
              </Text>
              <TouchableOpacity
                onPress={() => setShowHelp(false)}
                style={styles.closeButton}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.modalText, isRTL && styles.modalTextRTL]}>
                {helpContent?.description}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "transparent",
    zIndex: 1000,
  },
  containerRTL: {
    right: "auto",
    left: 0,
  },
  toolbarContainer: {
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toolbarContainerRTL: {
    alignItems: "flex-start",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
  toolbarRTL: {
    flexDirection: "row-reverse",
  },
  gearButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  gearButtonRTL: {
    // No specific RTL styles needed for gear button
  },
  gearIcon: {
    textShadowColor: "rgba(16, 185, 129, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  expandedButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    gap: 8,
  },
  expandedButtonsRTL: {
    flexDirection: "row-reverse",
    marginLeft: 0,
    marginRight: 8,
  },
  animatedButton: {
    // Container for animated buttons
  },
  languageButton: {
    backgroundColor: "#4ECDC4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 40,
    alignItems: "center",
    shadowColor: "#4ECDC4",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  languageButtonRTL: {
    // No specific RTL styles needed
  },
  languageText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  helpButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#4ECDC4",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  helpButtonRTL: {
    // No specific RTL styles needed
  },
  helpIcon: {
    textShadowColor: "rgba(16, 185, 129, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: "100%",
    maxHeight: "75%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  modalContentRTL: {
    textAlign: "right",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f4",
    paddingTop: 24,
  },
  modalHeaderRTL: {
    flexDirection: "row-reverse",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },
  modalTitleRTL: {
    textAlign: "right",
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 26,
    color: "#4a4a4a",
  },
  modalTextRTL: {
    textAlign: "right",
  },
});

export default LanguageToolbar;
