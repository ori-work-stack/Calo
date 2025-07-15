import React from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useEffect } from "react";

export default function QuestionnaireTabScreen() {
  useEffect(() => {
    // Redirect to the main questionnaire screen
    router.replace("/questionnaire");
  }, []);

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
