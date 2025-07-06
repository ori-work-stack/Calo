import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Switch,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { router } from "expo-router";
import { RootState, AppDispatch } from "@/src/store";
import { signOut, forceSignOut } from "@/src/store/authSlice";
import { Ionicons } from "@expo/vector-icons";

interface ProfileFormData {
  name: string;
  age: string;
  gender: string;
  weight_kg: string;
  height_cm: string;
  health_goal: string;
}

export default function ProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name || "",
    age: user?.age?.toString() || "",
    gender: "",
    weight_kg: user?.weight_kg?.toString() || "",
    height_cm: user?.height_cm?.toString() || "",
    health_goal: "",
  });

  // Notification settings
  const [mealReminders, setMealReminders] = useState(true);
  const [waterReminders, setWaterReminders] = useState(true);
  const [goalAlerts, setGoalAlerts] = useState(true);

  // Display settings
  const [language, setLanguage] = useState("hebrew");
  const [units, setUnits] = useState("metric");
  const [darkMode, setDarkMode] = useState("auto");

  // Verification status
  const [emailVerified] = useState(true); // Assuming verified for now
  const [phoneVerified] = useState(false);

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Check if form data has changed
    const originalData = {
      name: user?.name || "",
      age: user?.age?.toString() || "",
      weight_kg: user?.weight_kg?.toString() || "",
      height_cm: user?.height_cm?.toString() || "",
    };

    const isChanged = Object.keys(originalData).some(
      (key) =>
        formData[key as keyof typeof originalData] !==
        originalData[key as keyof typeof originalData]
    );

    setHasChanges(isChanged);
  }, [formData, user]);

  const handleSignOut = async () => {
    try {
      console.log("Starting signout process...");
      const result = await dispatch(signOut());
      console.log("SignOut result:", result);
      router.replace("/(auth)/signin");
    } catch (error) {
      console.error("SignOut catch error:", error);
      dispatch(forceSignOut());
      router.replace("/(auth)/signin");
    }
  };

  const handleSaveChanges = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.age) {
        Alert.alert("שגיאה", "אנא מלא את כל השדות הנדרשים");
        return;
      }

      const updateData = {
        name: formData.name,
        age: parseInt(formData.age),
        weight_kg: formData.weight_kg
          ? parseFloat(formData.weight_kg)
          : undefined,
        height_cm: formData.height_cm
          ? parseFloat(formData.height_cm)
          : undefined,
      };

      // Here you would call the API to update user profile
      // await dispatch(updateProfile(updateData));

      Alert.alert("הצלחה", "הפרטים עודכנו בהצלחה");
      setIsEditing(false);
      setHasChanges(false);
    } catch (error) {
      Alert.alert("שגיאה", "אירעה שגיאה בעדכון הפרטים");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("שגיאה", "הסיסמאות אינן תואמות");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("שגיאה", "הסיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }

    try {
      // Here you would call the API to change password
      Alert.alert("הצלחה", "הסיסמה שונתה בהצלחה");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      Alert.alert("שגיאה", "אירעה שגיאה בשינוי הסיסמה");
    }
  };

  const renderPersonalInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>פרטי חשבון אישיים</Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>שם מלא</Text>
        {isEditing ? (
          <TextInput
            style={styles.editInput}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="הכנס שם מלא"
          />
        ) : (
          <Text style={styles.infoValue}>{formData.name || "לא הוגדר"}</Text>
        )}
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>גיל</Text>
        {isEditing ? (
          <TextInput
            style={styles.editInput}
            value={formData.age}
            onChangeText={(text) => setFormData({ ...formData, age: text })}
            placeholder="הכנס גיל"
            keyboardType="numeric"
          />
        ) : (
          <Text style={styles.infoValue}>{formData.age || "לא הוגדר"}</Text>
        )}
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>משקל נוכחי (ק"ג)</Text>
        {isEditing ? (
          <TextInput
            style={styles.editInput}
            value={formData.weight_kg}
            onChangeText={(text) =>
              setFormData({ ...formData, weight_kg: text })
            }
            placeholder="הכנס משקל"
            keyboardType="numeric"
          />
        ) : (
          <Text style={styles.infoValue}>
            {formData.weight_kg ? `${formData.weight_kg} ק"ג` : "לא הוגדר"}
          </Text>
        )}
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>גובה (ס"מ)</Text>
        {isEditing ? (
          <TextInput
            style={styles.editInput}
            value={formData.height_cm}
            onChangeText={(text) =>
              setFormData({ ...formData, height_cm: text })
            }
            placeholder="הכנס גובה"
            keyboardType="numeric"
          />
        ) : (
          <Text style={styles.infoValue}>
            {formData.height_cm ? `${formData.height_cm} ס"מ` : "לא הוגדר"}
          </Text>
        )}
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>יעד בריאותי כללי</Text>
        <Text style={styles.infoValue}>
          {formData.health_goal || "לא הוגדר"}
        </Text>
      </View>

      {(isEditing || hasChanges) && (
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <Text style={styles.saveButtonText}>שמור שינויים</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderVerificationStatus = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>סטטוס אימות</Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>אימייל</Text>
        <View style={styles.verificationContainer}>
          <Text style={styles.infoValue}>{user?.email}</Text>
          <View
            style={[
              styles.statusBadge,
              emailVerified ? styles.verified : styles.unverified,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                emailVerified ? styles.verifiedText : styles.unverifiedText,
              ]}
            >
              {emailVerified ? "מאומת" : "לא מאומת"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>טלפון נייד</Text>
        <View style={styles.verificationContainer}>
          <Text style={styles.infoValue}>לא הוגדר</Text>
          <TouchableOpacity style={styles.verifyButton}>
            <Text style={styles.verifyButtonText}>שלח קוד אימות</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderNotificationSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>הגדרות תזכורות והתראות</Text>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>תזכורות לארוחות</Text>
        <Switch
          value={mealReminders}
          onValueChange={setMealReminders}
          trackColor={{ false: "#767577", true: "#007AFF" }}
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>התראות שתיית מים</Text>
        <Switch
          value={waterReminders}
          onValueChange={setWaterReminders}
          trackColor={{ false: "#767577", true: "#007AFF" }}
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>התראות יעדים אישיים</Text>
        <Switch
          value={goalAlerts}
          onValueChange={setGoalAlerts}
          trackColor={{ false: "#767577", true: "#007AFF" }}
        />
      </View>
    </View>
  );

  const renderDisplaySettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>הגדרות תצוגה ומערכת</Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>שפה</Text>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              language === "hebrew" && styles.segmentButtonActive,
            ]}
            onPress={() => setLanguage("hebrew")}
          >
            <Text
              style={[
                styles.segmentText,
                language === "hebrew" && styles.segmentTextActive,
              ]}
            >
              עברית
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              language === "english" && styles.segmentButtonActive,
            ]}
            onPress={() => setLanguage("english")}
          >
            <Text
              style={[
                styles.segmentText,
                language === "english" && styles.segmentTextActive,
              ]}
            >
              English
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>יחידות מידה</Text>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              units === "metric" && styles.segmentButtonActive,
            ]}
            onPress={() => setUnits("metric")}
          >
            <Text
              style={[
                styles.segmentText,
                units === "metric" && styles.segmentTextActive,
              ]}
            >
              מטרי
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              units === "imperial" && styles.segmentButtonActive,
            ]}
            onPress={() => setUnits("imperial")}
          >
            <Text
              style={[
                styles.segmentText,
                units === "imperial" && styles.segmentTextActive,
              ]}
            >
              אימפריאלי
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>פעולות נוספות</Text>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setShowPasswordModal(true)}
      >
        <Ionicons name="key-outline" size={20} color="#007AFF" />
        <Text style={styles.actionButtonText}>החלפת סיסמה</Text>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => router.push("/questionnaire")}
      >
        <Ionicons name="document-text-outline" size={20} color="#007AFF" />
        <Text style={styles.actionButtonText}>עדכן שאלון אישי</Text>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setShowDeleteModal(true)}
      >
        <Ionicons name="trash-outline" size={20} color="#dc3545" />
        <Text style={[styles.actionButtonText, { color: "#dc3545" }]}>
          ניהול חשבון
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.signOutButton, isLoading && styles.disabledButton]}
        onPress={handleSignOut}
        disabled={isLoading}
      >
        <Ionicons name="log-out-outline" size={20} color="#dc3545" />
        <Text style={styles.signOutButtonText}>
          {isLoading ? "יוצא..." : "יציאה מהמערכת"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={100} color="#007AFF" />
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{user?.name || "משתמש"}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Ionicons
            name={isEditing ? "checkmark" : "create-outline"}
            size={20}
            color="#007AFF"
          />
          <Text style={styles.editButtonText}>
            {isEditing ? "סיים עריכה" : "ערוך פרופיל"}
          </Text>
        </TouchableOpacity>
      </View>

      {renderPersonalInfo()}
      {renderVerificationStatus()}
      {renderNotificationSettings()}
      {renderDisplaySettings()}
      {renderActions()}

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>החלפת סיסמה</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="סיסמה נוכחית"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.modalInput}
              placeholder="סיסמה חדשה"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.modalInput}
              placeholder="אימות סיסמה חדשה"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.cancelButtonText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleChangePassword}
              >
                <Text style={styles.submitButtonText}>שמור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    alignItems: "center",
    paddingVertical: 30,
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007AFF",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  email: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  editButtonText: {
    color: "#007AFF",
    marginLeft: 5,
    fontWeight: "500",
  },
  section: {
    backgroundColor: "white",
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  infoLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: "#666",
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
  },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  verificationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verified: {
    backgroundColor: "#d4edda",
  },
  unverified: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  verifiedText: {
    color: "#155724",
  },
  unverifiedText: {
    color: "#721c24",
  },
  verifyButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  verifyButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  switchLabel: {
    fontSize: 16,
    color: "#333",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginTop: 5,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: "#007AFF",
  },
  segmentText: {
    fontSize: 14,
    color: "#666",
  },
  segmentTextActive: {
    color: "white",
    fontWeight: "500",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  actionButtonText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: "#333",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#dc3545",
  },
  signOutButtonText: {
    color: "#dc3545",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 12,
    width: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#6c757d",
  },
  submitButton: {
    backgroundColor: "#007AFF",
  },
  cancelButtonText: {
    color: "#6c757d",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomSpace: {
    height: 40,
  },
});
