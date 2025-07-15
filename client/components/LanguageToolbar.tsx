import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { BlurView } from "expo-blur";

interface LanguageToolbarProps {
  helpContent?: {
    title: string;
    description: string;
  };
}

const { width } = Dimensions.get("window");

export default function LanguageToolbar({ helpContent }: LanguageToolbarProps) {
  const { language, setLanguage, t } = useLanguage();
  const [showHelp, setShowHelp] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));
  const [expandAnimation] = useState(new Animated.Value(0));

  const toggleLanguage = () => {
    setLanguage(language === "he" ? "en" : "he");
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    Animated.timing(expandAnimation, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const toggleLanguageMenu = () => {
    setShowLanguageMenu(!showLanguageMenu);
    Animated.timing(animatedValue, {
      toValue: showLanguageMenu ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const languages = [
    { code: "he", name: "עברית", flag: "🇮🇱" },
    { code: "en", name: "English", flag: "🇺🇸" },
  ];

  const expandedHeight = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [48, helpContent ? 144 : 96], // Adjust based on number of tools
  });

  const toolsRotation = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <>
      {/* Collapsible Toolbar */}
      <View style={styles.toolbarContainer}>
        <Animated.View style={[styles.toolbar, { height: expandedHeight }]}>
          <LinearGradient
            colors={["#4ECDC4", "#44A08D"]}
            style={styles.toolbarGradient}
          >
            {/* Main Tools Button */}
            <TouchableOpacity
              style={styles.toolsButton}
              onPress={toggleExpanded}
              activeOpacity={0.8}
            >
              <Animated.View style={{ transform: [{ rotate: toolsRotation }] }}>
                <Ionicons name="construct" size={20} color="#fff" />
              </Animated.View>
            </TouchableOpacity>

            {/* Expanded Tools */}
            {isExpanded && (
              <Animated.View
                style={[
                  styles.expandedTools,
                  {
                    opacity: expandAnimation,
                    transform: [
                      {
                        translateY: expandAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {/* Language Toggle Button */}
                <TouchableOpacity
                  style={styles.toolButton}
                  onPress={toggleLanguage}
                  activeOpacity={0.8}
                >
                  <Text style={styles.languageText}>
                    {language === "he" ? "🇺🇸" : "🇮🇱"}
                  </Text>
                </TouchableOpacity>

                {/* Help Button */}
                {helpContent && (
                  <TouchableOpacity
                    style={styles.toolButton}
                    onPress={() => setShowHelp(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="help-circle-outline"
                      size={20}
                      color="#fff"
                    />
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Enhanced Help Modal */}
      {helpContent && (
        <Modal
          visible={showHelp}
          transparent
          animationType="slide"
          onRequestClose={() => setShowHelp(false)}
        >
          <View style={styles.helpModalOverlay}>
            <BlurView intensity={20} style={styles.blurBackground}>
              <TouchableOpacity
                style={styles.modalBackdrop}
                onPress={() => setShowHelp(false)}
                activeOpacity={1}
              />

              <View style={styles.helpModalContent}>
                <LinearGradient
                  colors={["#4ECDC4", "#44A08D"]}
                  style={styles.helpModalHeader}
                >
                  <Text style={styles.helpModalTitle}>{helpContent.title}</Text>
                  <TouchableOpacity
                    onPress={() => setShowHelp(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </LinearGradient>

                <ScrollView
                  style={styles.helpModalBody}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.helpModalText}>
                    {helpContent.description}
                  </Text>
                </ScrollView>

                <View style={styles.helpModalFooter}>
                  <TouchableOpacity
                    style={styles.gotItButton}
                    onPress={() => setShowHelp(false)}
                  >
                    <LinearGradient
                      colors={["#4ECDC4", "#44A08D"]}
                      style={styles.gotItGradient}
                    >
                      <Text style={styles.gotItText}>Got it!</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </View>
        </Modal>
      )}

      {/* Language Selection Menu */}
      <Modal
        visible={showLanguageMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageMenu(false)}
      >
        <View style={styles.languageModalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowLanguageMenu(false)}
            activeOpacity={1}
          />

          <View style={styles.languageMenu}>
            <BlurView intensity={80} style={styles.languageMenuContent}>
              <Text style={styles.languageMenuTitle}>Select Language</Text>

              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    language === lang.code && styles.selectedLanguage,
                  ]}
                  onPress={() => {
                    setLanguage(lang.code);
                    setShowLanguageMenu(false);
                  }}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.languageName,
                      language === lang.code && styles.selectedLanguageName,
                    ]}
                  >
                    {lang.name}
                  </Text>
                  {language === lang.code && (
                    <Ionicons name="checkmark" size={20} color="#4ECDC4" />
                  )}
                </TouchableOpacity>
              ))}
            </BlurView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toolbarContainer: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1000,
  },
  toolbar: {
    width: 48,
    borderRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: "hidden",
  },
  toolbarGradient: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  toolsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  expandedTools: {
    flex: 1,
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  toolButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 4,
  },
  languageText: {
    fontSize: 16,
  },
  helpModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  blurBackground: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  helpModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  helpModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingBottom: 20,
  },
  helpModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  helpModalBody: {
    padding: 24,
    paddingTop: 0,
    maxHeight: 300,
  },
  helpModalText: {
    fontSize: 16,
    color: "#666",
    lineHeight: 26,
    textAlign: "left",
  },
  helpModalFooter: {
    padding: 24,
    paddingTop: 16,
  },
  gotItButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  gotItGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  gotItText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  languageModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  languageMenu: {
    width: width * 0.7,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  languageMenuContent: {
    padding: 20,
  },
  languageMenuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  selectedLanguage: {
    backgroundColor: "rgba(78, 205, 196, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(78, 205, 196, 0.3)",
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    fontWeight: "500",
  },
  selectedLanguageName: {
    color: "#4ECDC4",
    fontWeight: "600",
  },
});
