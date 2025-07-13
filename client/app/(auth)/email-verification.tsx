import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/src/store";
import { userAPI } from "@/src/services/api";
import { LinearGradient } from "expo-linear-gradient";

export default function EmailVerificationScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { email } = useLocalSearchParams();

  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleVerifyEmail = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert("שגיאה", "אנא הכנס קוד אימות בן 6 ספרות");
      return;
    }

    try {
      setIsLoading(true);
      console.log("🔄 Verifying email:", email, "with code:", verificationCode);

      const response = await userAPI.verifyEmail(
        email as string,
        verificationCode
      );
      console.log("✅ Verification response:", response);

      if (response.success && response.user && response.token) {
        // Store token in SecureStore for mobile
        const { Platform } = require("react-native");
        if (Platform.OS !== "web") {
          const SecureStore = require("expo-secure-store");
          await SecureStore.setItemAsync("auth_token_secure", response.token);
          console.log("✅ Token stored in SecureStore for mobile");
        }

        // Store auth data in Redux
        dispatch({
          type: "auth/setUser",
          payload: response.user,
        });

        dispatch({
          type: "auth/setToken",
          payload: response.token,
        });

        console.log("✅ User authenticated, redirecting to payment-plan");

        // Navigate directly without alert for better UX
        router.replace("/payment-plan");
      } else {
        throw new Error(response.error || "אימות נכשל");
      }
    } catch (error: any) {
      console.error("💥 Verification error:", error);
      Alert.alert("שגיאה", error.message || "אימות האימייל נכשל");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#667eea", "#764ba2"]}
      style={styles.gradientContainer}
    >
      <Animated.View
        style={[
          styles.container,
          isRTL && styles.containerRTL,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.emailIcon}>📧</Text>
          </View>
          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            אימות אימייל
          </Text>
          <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
            שלחנו קוד אימות בן 6 ספרות לכתובת:
          </Text>
          <Text style={[styles.emailText, isRTL && styles.emailTextRTL]}>
            {email}
          </Text>
          <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
            אנא בדוק את תיבת הדואר שלך (כולל תיקיית ספאם)
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, isRTL && styles.inputRTL]}
            placeholder="הכנס קוד אימות"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="numeric"
            maxLength={6}
            textAlign={isRTL ? "right" : "left"}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
            onPress={handleVerifyEmail}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>אמת אימייל</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.resendButton,
              (isLoading || resendCooldown > 0) && styles.buttonDisabled,
            ]}
            onPress={async () => {
              if (resendCooldown > 0) return;

              try {
                setIsLoading(true);
                const response = await userAPI.resendVerificationCode(
                  email as string
                );
                if (response.success) {
                  setResendCooldown(60); // 60 second cooldown
                  Alert.alert("הודעה", "קוד חדש נשלח לאימייל שלך");
                } else {
                  throw new Error(response.error || "Failed to resend code");
                }
              } catch (error: any) {
                Alert.alert("שגיאה", error.message || "שליחת הקוד נכשלה");
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading || resendCooldown > 0}
          >
            <Text style={styles.resendButtonText}>
              {resendCooldown > 0
                ? `שלח קוד חדש (${resendCooldown})`
                : "שלח קוד חדש"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    margin: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  containerRTL: {
    direction: "rtl",
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emailIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  titleRTL: {
    textAlign: "right",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleRTL: {
    textAlign: "right",
  },
  emailText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  emailTextRTL: {
    textAlign: "right",
  },
  form: {
    flex: 1,
  },
  input: {
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 15,
    padding: 15,
    fontSize: 20,
    marginBottom: 25,
    backgroundColor: "#fff",
    textAlign: "center",
    letterSpacing: 8,
    fontWeight: "bold",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputRTL: {
    textAlign: "center",
  },
  verifyButton: {
    backgroundColor: "#007AFF",
    borderRadius: 15,
    padding: 18,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  resendButton: {
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  resendButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  linkText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  devNote: {
    backgroundColor: "#FFF3CD",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFEAA7",
    marginTop: 20,
  },
  devNoteText: {
    fontSize: 14,
    color: "#856404",
    textAlign: "center",
    fontWeight: "500",
  },
});
