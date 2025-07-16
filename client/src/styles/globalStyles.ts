import { StyleSheet, Platform } from "react-native";

export const GlobalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  safeContainer: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
  },

  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  // Header styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#007AFF",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },

  headerButton: {
    padding: 8,
    borderRadius: 20,
  },

  // Card styles
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },

  cardContent: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
  },

  // Button styles
  primaryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  dangerButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  warningButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // Button text styles
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  dangerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Input styles
  input: {
    borderWidth: 1,
    borderColor: "#E1E5E9",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#333333",
  },

  inputFocused: {
    borderColor: "#007AFF",
    borderWidth: 2,
  },

  inputError: {
    borderColor: "#FF3B30",
    borderWidth: 2,
  },

  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  // Text styles
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 16,
  },

  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
  },

  body: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
  },

  caption: {
    fontSize: 14,
    color: "#999999",
    lineHeight: 20,
  },

  // RTL Support
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },

  ltrText: {
    textAlign: "left",
    writingDirection: "ltr",
  },

  // Spacing
  marginSmall: {
    margin: 8,
  },

  marginMedium: {
    margin: 16,
  },

  marginLarge: {
    margin: 24,
  },

  paddingSmall: {
    padding: 8,
  },

  paddingMedium: {
    padding: 16,
  },

  paddingLarge: {
    padding: 24,
  },

  // Layout
  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  column: {
    flexDirection: "column",
  },

  spaceBetween: {
    justifyContent: "space-between",
  },

  spaceAround: {
    justifyContent: "space-around",
  },

  center: {
    justifyContent: "center",
    alignItems: "center",
  },

  // Status colors
  success: {
    color: "#28A745",
  },

  error: {
    color: "#FF3B30",
  },

  warning: {
    color: "#FF9500",
  },

  info: {
    color: "#007AFF",
  },

  // Background colors
  successBackground: {
    backgroundColor: "#D4F6DD",
  },

  errorBackground: {
    backgroundColor: "#FFEBEE",
  },

  warningBackground: {
    backgroundColor: "#FFF3CD",
  },

  infoBackground: {
    backgroundColor: "#E3F2FD",
  },
});

// Color palette
export const Colors = {
  primary: "#007AFF",
  secondary: "#5856D6",
  success: "#28A745",
  warning: "#FF9500",
  danger: "#FF3B30",
  info: "#17A2B8",
  light: "#F8F9FA",
  dark: "#343A40",
  white: "#FFFFFF",
  black: "#000000",
  gray: {
    100: "#F8F9FA",
    200: "#E9ECEF",
    300: "#DEE2E6",
    400: "#CED4DA",
    500: "#ADB5BD",
    600: "#6C757D",
    700: "#495057",
    800: "#343A40",
    900: "#212529",
  },
};

// Spacing system
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography
export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "bold" as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: "bold" as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: "bold" as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 28,
  },
  body1: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
  },
};
