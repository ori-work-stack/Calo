import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
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

const { width, height } = Dimensions.get("window");

export default function LanguageToolbar({ helpContent }: LanguageToolbarProps) {
  const { language, setLanguage, t } = useLanguage();
  const [showHelp, setShowHelp] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Use useRef for animated values to prevent recreation on re-renders
  const animatedValue = useRef(new Animated.Value(0)).current;
  const expandAnimation = useRef(new Animated.Value(0)).current;

  const toggleLanguage = () => {
    setLanguage(language === "he" ? "en" : "he");
  };

  const toggleExpanded = () => {
    const newValue = !isExpanded;
    setIsExpanded(newValue);

    Animated.timing(expandAnimation, {
      toValue: newValue ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const toggleLanguageMenu = () => {
    const newValue = !showLanguageMenu;
    setShowLanguageMenu(newValue);

    Animated.timing(animatedValue, {
      toValue: newValue ? 1 : 0,
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
    outputRange: [48, helpContent ? 144 : 96],
  });

  const toolsRotation = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  // Improved safe area calculation
  const getTopOffset = () => {
    const statusBarHeight = StatusBar.currentHeight || 0;
    if (Platform.OS === "ios") {
      return height > 800 ? 60 : 50;
    }
    return statusBarHeight + 20;
  };

  const renderHelpModalContent = () => {
    return (
      <View style={styles.helpModalContent}>
        <LinearGradient
          colors={["#4ECDC4", "#44A08D"]}
          style={styles.helpModalHeader}
        >
          <Text style={styles.helpModalTitle}>{helpContent?.title}</Text>
          <TouchableOpacity
            onPress={() => setShowHelp(false)}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView
          style={styles.helpModalBody}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <Text style={styles.helpModalText}>{helpContent?.description}</Text>
        </ScrollView>

        <View style={styles.helpModalFooter}>
          <TouchableOpacity
            style={styles.gotItButton}
            onPress={() => setShowHelp(false)}
            activeOpacity={0.8}
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
    );
  };

  const renderLanguageMenuContent = () => {
    return (
      <>
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
            activeOpacity={0.8}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
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
      </>
    );
  };

  return (
    <>
      {/* Collapsible Toolbar */}
      <View style={[styles.toolbarContainer, { top: getTopOffset() }]}>
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
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowHelp(false)}
          statusBarTranslucent={true}
        >
          <View style={styles.helpModalOverlay}>
            {Platform.OS === "ios" ? (
              <BlurView intensity={20} style={styles.blurBackground}>
                <TouchableOpacity
                  style={styles.modalBackdrop}
                  onPress={() => setShowHelp(false)}
                  activeOpacity={1}
                />
                {renderHelpModalContent()}
              </BlurView>
            ) : (
              <View style={styles.androidModalBackground}>
                <TouchableOpacity
                  style={styles.modalBackdrop}
                  onPress={() => setShowHelp(false)}
                  activeOpacity={1}
                />
                {renderHelpModalContent()}
              </View>
            )}
          </View>
        </Modal>
      )}

      {/* Language Selection Menu */}
      <Modal
        visible={showLanguageMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageMenu(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.languageModalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowLanguageMenu(false)}
            activeOpacity={1}
          />

          <View style={styles.languageMenu}>
            {Platform.OS === "ios" ? (
              <BlurView intensity={80} style={styles.languageMenuContent}>
                {renderLanguageMenuContent()}
              </BlurView>
            ) : (
              <View
                style={[styles.languageMenuContent, styles.androidBlurFallback]}
              >
                {renderLanguageMenuContent()}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toolbarContainer: {
    position: "absolute",
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
  // Enhanced modal styles with better mobile support
  helpModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: Platform.OS === "ios" ? "transparent" : "rgba(0,0,0,0.5)",
  },
  blurBackground: {
    flex: 1,
    justifyContent: "flex-end",
  },
  androidModalBackground: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBackdrop: {
    flex: 1,
    width: "100%",
  },
  helpModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8, // Use percentage of screen height
    minHeight: 300, // Ensure minimum height
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    // Ensure it's positioned correctly
    width: "100%",
    alignSelf: "center",
  },
  helpModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingBottom: 20,
    // Ensure header doesn't get clipped
    minHeight: 64,
  },
  helpModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "left",
  },
  closeButton: {
    padding: 8, // Increased padding for better touch target
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginLeft: 12,
  },
  helpModalBody: {
    padding: 24,
    paddingTop: 0,
    flex: 1, // Allow it to take available space
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
    backgroundColor: "#f8f9fa", // Slight background to distinguish footer
  },
  gotItButton: {
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 48, // Ensure minimum touch target
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
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  languageMenu: {
    width: Math.min(width * 0.8, 300),
    maxWidth: width - 40, // Ensure it doesn't exceed screen width
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
    backgroundColor: "white", // Ensure background color
  },
  androidBlurFallback: {
    backgroundColor: "rgba(255,255,255,0.95)",
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
    backgroundColor: "rgba(0,0,0,0.05)", // More visible background
    minHeight: 56, // Increased minimum touch target
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
