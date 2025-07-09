import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useDispatch, useSelector } from "react-redux";
import { signUp } from "@/src/store/authSlice";
import { RootState, AppDispatch } from "@/src/store";
import LanguageSelector from "@/components/LanguageSelector";

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      Alert.alert(t("common.error"), "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t("common.error"), "Passwords do not match");
      return;
    }

    try {
      const result = await dispatch(
        signUp({
          email,
          password,
          name,
          birth_date: new Date(), // You should get this from a date picker
        })
      ).unwrap();

      if (result.success) {
        router.replace("/questionnaire");
      }
    } catch (error: any) {
      Alert.alert(t("common.error"), error || "Failed to create account");
    }
  };

  return (
    <ScrollView style={[styles.container, isRTL && styles.containerRTL]}>
      <View style={styles.header}>
        <Text style={[styles.title, isRTL && styles.titleRTL]}>
          {t("auth.createAccount")}
        </Text>
        <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
          {t("auth.welcome")}
        </Text>
      </View>

      <View style={styles.languageSection}>
        <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
          {t("auth.languagePreference")}
        </Text>
        <LanguageSelector
          showModal={showLanguageModal}
          onToggleModal={() => setShowLanguageModal(!showLanguageModal)}
        />
      </View>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, isRTL && styles.inputRTL]}
          placeholder={t("profile.name")}
          value={name}
          onChangeText={setName}
          textAlign={isRTL ? "right" : "left"}
          editable={!isLoading}
        />

        <TextInput
          style={[styles.input, isRTL && styles.inputRTL]}
          placeholder={t("auth.email")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          textAlign={isRTL ? "right" : "left"}
          editable={!isLoading}
        />

        <TextInput
          style={[styles.input, isRTL && styles.inputRTL]}
          placeholder={t("auth.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textAlign={isRTL ? "right" : "left"}
          editable={!isLoading}
        />

        <TextInput
          style={[styles.input, isRTL && styles.inputRTL]}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textAlign={isRTL ? "right" : "left"}
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.signUpButtonText}>{t("auth.signUp")}</Text>
          )}
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={[styles.footer, isRTL && styles.footerRTL]}>
          <Text style={styles.footerText}>{t("auth.hasAccount")} </Text>
          <Link href="/signin" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>{t("auth.signIn")}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  containerRTL: {
    direction: "rtl",
  },
  header: {
    marginTop: 60,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  titleRTL: {
    textAlign: "right",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  subtitleRTL: {
    textAlign: "right",
  },
  languageSection: {
    marginBottom: 30,
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
  form: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  inputRTL: {
    textAlign: "right",
  },
  signUpButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerRTL: {
    flexDirection: "row-reverse",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
  },
  linkText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
});
