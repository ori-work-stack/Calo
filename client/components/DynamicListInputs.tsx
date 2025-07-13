import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface DynamicListInputProps {
  label: string;
  placeholder: string;
  value: string[];
  onValueChange: (value: string[]) => void;
  maxItems?: number;
  style?: any;
}

export const DynamicListInput: React.FC<DynamicListInputProps> = ({
  label,
  placeholder,
  value = [], // Ensure value is an array by default
  onValueChange,
  maxItems = 10,
  style,
}) => {
  const [inputText, setInputText] = useState("");

  // Defensive programming - ensure value is always an array and onValueChange is a function
  const safeValue = Array.isArray(value) ? value : [];
  const safeOnValueChange = onValueChange || (() => {});

  const addItem = () => {
    const trimmedText = inputText.trim();
    if (
      trimmedText &&
      !safeValue.includes(trimmedText) &&
      safeValue.length < maxItems
    ) {
      safeOnValueChange([...safeValue, trimmedText]);
      setInputText("");
    }
  };

  const removeItem = (index: number) => {
    const newValue = safeValue.filter((_, i) => i !== index);
    safeOnValueChange(newValue);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={placeholder}
          onSubmitEditing={addItem}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[
            styles.addButton,
            !inputText.trim() && styles.addButtonDisabled,
          ]}
          onPress={addItem}
          disabled={!inputText.trim() || safeValue.length >= maxItems}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {safeValue.length > 0 && (
        <ScrollView
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {Array.isArray(safeValue) &&
            safeValue.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>{item}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeItem(index)}
                >
                  <Ionicons name="close" size={16} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
        </ScrollView>
      )}

      {safeValue.length > 0 && (
        <Text style={styles.countText}>
          {safeValue.length} {safeValue.length === 1 ? "item" : "items"} added
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  addButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 44,
  },
  addButtonDisabled: {
    backgroundColor: "#ccc",
  },
  listContainer: {
    maxHeight: 150,
    marginTop: 10,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 6,
    marginBottom: 5,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  removeButton: {
    padding: 5,
    marginLeft: 10,
  },
  countText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    fontStyle: "italic",
  },
});
