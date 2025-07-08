import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Button,
  Platform,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/src/store";
import { signUp, clearError } from "@/src/store/authSlice";
import { SignUpSchema } from "@/src/types";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function SignUp() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    birth_date: new Date(),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || formData.birth_date;
    setShowDatePicker(Platform.OS === "ios");
    setFormData({ ...formData, birth_date: currentDate });
  };

  const handleSignUp = async () => {
    try {
      console.log("Starting sign up process...");

      // Validate required fields
      if (!formData.email || !formData.password || !formData.name) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      const data = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        birth_date: formData.birth_date,
      };
      console.log("Sign up data:", data);

      const validatedData = SignUpSchema.parse(data);
      const result = await dispatch(signUp(validatedData));
      console.log("Sign up result:", result);

      if (signUp.fulfilled.match(result)) {
        console.log("Sign up successful! Redirecting to payment plan");
        // Force redirect to payment plan after signup
        router.replace("/payment-plan");
      } else {
        console.log("Sign up failed:", result.payload);
      }
    } catch (error: any) {
      Alert.alert("Error", error.issues?.[0]?.message || "Invalid input");
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      <TextInput
        style={styles.input}
        placeholder="Email *"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password *"
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Name *"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />

      <Text style={styles.label}>Birth Date *</Text>
      <Button
        title={formData.birth_date.toDateString()}
        onPress={() => setShowDatePicker(true)}
      />

      {showDatePicker && (
        <DateTimePicker
          value={formData.birth_date}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignUp}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <Link href="/(auth)/signin" style={styles.link}>
        <Text>Already have an account? Sign In</Text>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    marginTop: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  link: {
    textAlign: "center",
    color: "#007AFF",
    marginBottom: 40,
  },
});
