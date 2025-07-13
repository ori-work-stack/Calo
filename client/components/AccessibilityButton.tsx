import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Type,
  Zap,
  X,
  Accessibility,
} from "lucide-react-native";

interface AccessibilityOptions {
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  reducedMotion: boolean;
}

interface AccessibilityButtonProps {
  style?: any;
  size?: number;
  color?: string;
}

const { width: screenWidth } = Dimensions.get("window");

export default function AccessibilityButton({
  style,
  size = 24,
  color = "#2C3E50",
}: AccessibilityButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [options, setOptions] = useState<AccessibilityOptions>({
    highContrast: false,
    largeText: false,
    screenReader: false,
    reducedMotion: false,
  });
  const [animation] = useState(new Animated.Value(0));

  // Apply accessibility changes to the app
  useEffect(() => {
    // In a real app, these would trigger actual accessibility changes
    if (options.highContrast) {
      console.log("High contrast mode enabled");
    }
    if (options.largeText) {
      console.log("Large text mode enabled");
    }
    if (options.screenReader) {
      console.log("Screen reader support enabled");
    }
    if (options.reducedMotion) {
      console.log("Reduced motion enabled");
    }
  }, [options]);

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;

    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    setIsExpanded(!isExpanded);
  };

  const toggleOption = (key: keyof AccessibilityOptions) => {
    setOptions((prev) => {
      const newOptions = {
        ...prev,
        [key]: !prev[key],
      };

      // Provide visual feedback
      console.log(`${key} ${newOptions[key] ? "enabled" : "disabled"}`);

      return newOptions;
    });
  };

  const panelScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const panelOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const panelTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  const accessibilityOptions = [
    {
      key: "highContrast" as keyof AccessibilityOptions,
      title: "ניגודיות גבוהה",
      titleEn: "High Contrast",
      description: "משפר את הניגודיות לקריאה טובה יותר",
      icon: options.highContrast ? (
        <Eye size={20} color="#FFFFFF" />
      ) : (
        <EyeOff size={20} color="#FFFFFF" />
      ),
    },
    {
      key: "largeText" as keyof AccessibilityOptions,
      title: "טקסט גדול",
      titleEn: "Large Text",
      description: "מגדיל את גודל הטקסט",
      icon: <Type size={20} color="#FFFFFF" />,
    },
    {
      key: "screenReader" as keyof AccessibilityOptions,
      title: "קורא מסך",
      titleEn: "Screen Reader",
      description: "תמיכה בקוראי מסך",
      icon: options.screenReader ? (
        <Volume2 size={20} color="#FFFFFF" />
      ) : (
        <VolumeX size={20} color="#FFFFFF" />
      ),
    },
    {
      key: "reducedMotion" as keyof AccessibilityOptions,
      title: "הפחתת תנועה",
      titleEn: "Reduced Motion",
      description: "מפחית אנימציות ותנועות",
      icon: <Zap size={20} color="#FFFFFF" />,
    },
  ];

  const getActiveOptionsCount = () => {
    return Object.values(options).filter(Boolean).length;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Accessibility Panel */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={toggleExpanded}
          />

          <Animated.View
            style={[
              styles.panel,
              {
                transform: [
                  { scale: panelScale },
                  { translateY: panelTranslateY },
                ],
                opacity: panelOpacity,
              },
            ]}
          >
            <LinearGradient
              colors={["#2C3E50", "#34495E"]}
              style={styles.panelGradient}
            >
              <View style={styles.panelHeader}>
                <View style={styles.panelTitleContainer}>
                  <Accessibility size={24} color="#FFFFFF" />
                  <View style={styles.titleTextContainer}>
                    <Text style={styles.panelTitle}>נגישות</Text>
                    {getActiveOptionsCount() > 0 && (
                      <View style={styles.activeIndicator}>
                        <Text style={styles.activeCount}>
                          {getActiveOptionsCount()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={toggleExpanded}
                  style={styles.closeButton}
                  accessibilityLabel="סגור תפריט נגישות"
                  accessibilityRole="button"
                >
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsContainer}>
                {accessibilityOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.optionButton,
                      options[option.key] && styles.optionButtonActive,
                    ]}
                    onPress={() => toggleOption(option.key)}
                    accessibilityLabel={`${option.title} - ${
                      options[option.key] ? "פעיל" : "לא פעיל"
                    }`}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: options[option.key] }}
                    accessibilityHint={option.description}
                  >
                    <LinearGradient
                      colors={
                        options[option.key]
                          ? ["#16A085", "#1ABC9C"]
                          : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]
                      }
                      style={styles.optionGradient}
                    >
                      <View style={styles.optionIconContainer}>
                        {option.icon}
                      </View>
                      <View style={styles.optionTextContainer}>
                        <Text
                          style={[
                            styles.optionText,
                            options[option.key] && styles.optionTextActive,
                          ]}
                        >
                          {option.title}
                        </Text>
                        <Text
                          style={[
                            styles.optionDescription,
                            options[option.key] &&
                              styles.optionDescriptionActive,
                          ]}
                        >
                          {option.description}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.toggleIndicator,
                          options[option.key] && styles.toggleIndicatorActive,
                        ]}
                      >
                        <View
                          style={[
                            styles.toggleDot,
                            options[option.key] && styles.toggleDotActive,
                          ]}
                        />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.panelFooter}>
                <Text style={styles.panelDescription}>
                  הגדרות נגישות אלו משפרות את חוויית השימוש עבור משתמשים עם
                  צרכים מיוחדים
                </Text>

                {getActiveOptionsCount() > 0 && (
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={() =>
                      setOptions({
                        highContrast: false,
                        largeText: false,
                        screenReader: false,
                        reducedMotion: false,
                      })
                    }
                    accessibilityLabel="איפוס כל הגדרות הנגישות"
                    accessibilityRole="button"
                  >
                    <Text style={styles.resetButtonText}>איפוס הכל</Text>
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          </Animated.View>
        </>
      )}

      {/* Main Accessibility Button */}
      <TouchableOpacity
        style={[
          styles.button,
          style,
          getActiveOptionsCount() > 0 && styles.buttonActive,
        ]}
        onPress={toggleExpanded}
        accessibilityLabel="פתח תפריט נגישות"
        accessibilityRole="button"
        accessibilityHint="פותח תפריט עם אפשרויות נגישות לשיפור חוויית השימוש"
        accessibilityState={{ expanded: isExpanded }}
      >
        <Accessibility
          size={size}
          color={getActiveOptionsCount() > 0 ? "#16A085" : color}
        />
        {getActiveOptionsCount() > 0 && (
          <View style={styles.buttonBadge}>
            <Text style={styles.buttonBadgeText}>
              {getActiveOptionsCount()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonActive: {
    backgroundColor: "#E8F8F5",
    borderWidth: 1,
    borderColor: "#16A085",
  },
  buttonBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#16A085",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonBadgeText: {
    fontSize: 10,
    fontFamily: "Inter-Bold",
    color: "#FFFFFF",
  },
  backdrop: {
    position: "absolute",
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: "transparent",
  },
  panel: {
    position: "absolute",
    top: 50,
    right: 0,
    width: Math.min(320, screenWidth - 40),
    borderRadius: 20,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  panelGradient: {
    borderRadius: 20,
    padding: 24,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  panelTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  titleTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  panelTitle: {
    fontSize: 20,
    fontFamily: "Rubik-SemiBold",
    color: "#FFFFFF",
  },
  activeIndicator: {
    marginLeft: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#16A085",
    justifyContent: "center",
    alignItems: "center",
  },
  activeCount: {
    fontSize: 12,
    fontFamily: "Inter-Bold",
    color: "#FFFFFF",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  optionButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  optionButtonActive: {
    shadowColor: "#16A085",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontFamily: "Rubik-Medium",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 2,
  },
  optionTextActive: {
    color: "#FFFFFF",
    fontFamily: "Rubik-SemiBold",
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: "Rubik-Regular",
    color: "rgba(255,255,255,0.6)",
    lineHeight: 16,
  },
  optionDescriptionActive: {
    color: "rgba(255,255,255,0.9)",
  },
  toggleIndicator: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleIndicatorActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignSelf: "flex-start",
  },
  toggleDotActive: {
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-end",
  },
  panelFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 20,
  },
  panelDescription: {
    fontSize: 12,
    fontFamily: "Rubik-Regular",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "center",
  },
  resetButtonText: {
    fontSize: 14,
    fontFamily: "Rubik-Medium",
    color: "rgba(255,255,255,0.9)",
  },
});
