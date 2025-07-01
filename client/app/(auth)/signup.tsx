import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/src/store";
import { signUp, clearError } from "@/src/store/authSlice";
import { SignUpSchema } from "@/src/types";

export default function SignUp() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    age: "",
    weight: "",
    height: "",
  });

  const handleSignUp = async () => {
    try {
      console.log("hello world");

      // Parse numeric fields with proper validation
      const parsedAge = parseInt(formData.age);
      const parsedWeight = parseFloat(formData.weight);
      const parsedHeight = parseFloat(formData.height);

      // Validate required fields
      if (
        !formData.email ||
        !formData.password ||
        !formData.name ||
        !formData.age
      ) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      if (isNaN(parsedAge)) {
        Alert.alert("Error", "Please enter a valid age");
        return;
      }

      const data = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        age: parsedAge,
        weight: isNaN(parsedWeight) ? undefined : parsedWeight,
        height: isNaN(parsedHeight) ? undefined : parsedHeight,
      };
      console.log(data);

      const validatedData = SignUpSchema.parse(data);
      const result = await dispatch(signUp(validatedData));
      console.log(result);

      if (signUp.fulfilled.match(result)) {
        console.log("Sign up successful, navigating to tabs...");
        router.replace("/(tabs)");
      } else {
        console.log("Sign up failed:", result.payload);
      }
    } catch (error: any) {
      Alert.alert("Error", error.issues?.[0]?.message || "Invalid input");
    }
  };

  React.useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Navigate to tabs when authentication is successful
  React.useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated, navigating to tabs...");
      router.replace("/(tabs)");
    }
  }, [isAuthenticated]);

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

      <TextInput
        style={styles.input}
        placeholder="Age *"
        value={formData.age}
        onChangeText={(text) => setFormData({ ...formData, age: text })}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Weight (kg, optional)"
        value={formData.weight}
        onChangeText={(text) => setFormData({ ...formData, weight: text })}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Height (cm, optional)"
        value={formData.height}
        onChangeText={(text) => setFormData({ ...formData, height: text })}
        keyboardType="numeric"
      />

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
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
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
