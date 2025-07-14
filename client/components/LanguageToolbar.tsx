import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/src/i18n/context/LanguageContext";

interface LanguageToolbarProps {
  helpContent?: {
    title: string;
    description: string;
  };
}

export default function LanguageToolbar({ helpContent }: LanguageToolbarProps) {
  const { language, setLanguage, t } = useLanguage();
  const [showHelp, setShowHelp] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === "he" ? "en" : "he");
  };

  return (
    <>
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarButton} onPress={toggleLanguage}>
          <Ionicons name="language" size={20} color="#007AFF" />
          <Text style={styles.toolbarButtonText}>
            {language === "he" ? "EN" : "עב"}
          </Text>
        </TouchableOpacity>

        {helpContent && (
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => setShowHelp(true)}
          >
            <Ionicons name="help-circle-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      {helpContent && (
        <Modal
          visible={showHelp}
          transparent
          animationType="fade"
          onRequestClose={() => setShowHelp(false)}
        >
          <View style={styles.helpModalOverlay}>
            <View style={styles.helpModalContent}>
              <View style={styles.helpModalHeader}>
                <Text style={styles.helpModalTitle}>{helpContent.title}</Text>
                <TouchableOpacity onPress={() => setShowHelp(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.helpModalBody}>
                <Text style={styles.helpModalText}>
                  {helpContent.description}
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    gap: 8,
  },
  toolbarButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    gap: 4,
  },
  toolbarButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
  },
  helpModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  helpModalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    maxHeight: "80%",
    width: "100%",
    maxWidth: 400,
  },
  helpModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  helpModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  helpModalBody: {
    padding: 20,
  },
  helpModalText: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
});
