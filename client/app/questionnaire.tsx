import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { router } from "expo-router";
import { RootState, AppDispatch } from "@/src/store";
import { saveQuestionnaire, clearError } from "@/src/store/questionnaireSlice";
import { Ionicons } from "@expo/vector-icons";
import { DynamicListInput } from "@/components/DynamicListInputs";

interface QuestionnaireData {
  // Personal data
  age: string;
  gender: string;
  height_cm: string;
  weight_kg: string;
  target_weight_kg: string;
  body_fat_percentage: string;
  additional_personal_info: string[];

  // Goals
  main_goal: string;
  main_goal_text: string[];
  specific_goal: string[];
  goal_timeframe_days: string;
  commitment_level: string;
  most_important_outcome: string[];
  special_personal_goal: string[];

  // Physical activity
  physical_activity_level: string;
  sport_frequency: string;
  sport_types: string[];
  sport_duration_min: string;
  workout_times: string[];
  uses_fitness_devices: boolean;
  fitness_device_type: string[];
  additional_activity_info: string[];

  // Health
  medical_conditions: string[];
  medical_conditions_text: string[];
  medications: string[];
  health_goals: string[];
  functional_issues: string[];
  food_related_medical_issues: string[];

  // Means and conditions
  meals_per_day: string;
  snacks_between_meals: boolean;
  meal_times: string[];
  cooking_preference: string;
  available_cooking_methods: string[];
  daily_food_budget: string;
  shopping_method: string[];
  daily_cooking_time: string;

  // Dietary preferences and restrictions
  kosher: boolean;
  allergies: string[];
  allergies_text: string[];
  dietary_style: string;
  meal_texture_preference: string[];
  disliked_foods: string[];
  liked_foods: string[];
  regular_drinks: string[];
  intermittent_fasting: boolean;
  fasting_hours: string;

  // Additional
  past_diet_difficulties: string[];

  // Additional schema fields
  program_duration?: string;
  meal_timing_restrictions?: string[];
  dietary_restrictions?: string[];
  willingness_to_follow?: boolean;
  upcoming_events?: string[];
  upload_frequency?: string;
  notifications_preference?: string[];
  personalized_tips?: boolean;
  health_metrics_integration?: boolean;
  family_medical_history?: string[];
  smoking_status?: string;
  sleep_hours_per_night?: string;
}

const MAIN_GOALS = [
  { key: "WEIGHT_LOSS", label: "ירידה במשקל" },
  { key: "WEIGHT_GAIN", label: "עלייה במסת שריר" },
  { key: "WEIGHT_MAINTENANCE", label: "שמירה על משקל" },
  { key: "MEDICAL_CONDITION", label: "מטרה רפואית" },
  { key: "ALERTNESS", label: "שיפור ערנות" },
  { key: "ENERGY", label: "הגדלת אנרגיה" },
  { key: "SLEEP_QUALITY", label: "איכות שינה" },
  { key: "SPORTS_PERFORMANCE", label: "ביצועי ספורט" },
  { key: "OTHER", label: "אחר" },
];

const PHYSICAL_ACTIVITY_LEVELS = [
  { key: "NONE", label: "ללא פעילות" },
  { key: "LIGHT", label: "קלה (1-2 פעמים בשבוע)" },
  { key: "MODERATE", label: "בינונית (3-4 פעמים בשבוע)" },
  { key: "HIGH", label: "גבוהה (5+ פעמים בשבוע)" },
];

const SPORT_FREQUENCIES = [
  { key: "NONE", label: "ללא" },
  { key: "ONCE_A_WEEK", label: "פעם בשבוע" },
  { key: "TWO_TO_THREE", label: "2-3 פעמים בשבוע" },
  { key: "FOUR_TO_FIVE", label: "4-5 פעמים בשבוע" },
  { key: "MORE_THAN_FIVE", label: "יותר מ-5 פעמים בשבוע" },
];

const COOKING_METHODS = [
  "מיקרוגל",
  "תנור",
  "כיריים",
  "סיר לחץ",
  "מחבת",
  "גריל",
  "אין אפשרויות בישול",
];

const DIETARY_STYLES = [
  "רגיל",
  "דל פחמימה",
  "קטוגני",
  "צמחוני",
  "טבעוני",
  "ים תיכוני",
  "דל שומן",
  "דל נתרן",
  "אחר",
];

const ALLERGENS = [
  "גלוטן",
  "חלב",
  "ביצים",
  "אגוזים",
  "בוטנים",
  "דגים",
  "רכיכות",
  "סויה",
  "אחר",
];

const REGULAR_DRINKS = [
  "מים",
  "קפה",
  "תה",
  "משקאות מתוקים",
  "אלכוהול",
  "משקאות ספורט",
  "משקאות דיאט",
];

export default function QuestionnaireScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isSaving, error } = useSelector(
    (state: RootState) => state.questionnaire
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [showTip, setShowTip] = useState("");

  const totalSteps = 8;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const [formData, setFormData] = useState<QuestionnaireData>({
    // Initialize with empty values - data will come from questionnaire if exists
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    target_weight_kg: "",
    body_fat_percentage: "",
    additional_personal_info: [],

    main_goal: "",
    main_goal_text: [],
    specific_goal: [],
    goal_timeframe_days: "",
    commitment_level: "",
    most_important_outcome: [],
    special_personal_goal: [],

    physical_activity_level: "",
    sport_frequency: "",
    sport_types: [],
    sport_duration_min: "",
    workout_times: [],
    uses_fitness_devices: false,
    fitness_device_type: [],
    additional_activity_info: [],

    medical_conditions: [],
    medical_conditions_text: [],
    medications: [],
    health_goals: [],
    functional_issues: [],
    food_related_medical_issues: [],

    meals_per_day: "3",
    snacks_between_meals: false,
    meal_times: [],
    cooking_preference: "",
    available_cooking_methods: [],
    daily_food_budget: "",
    shopping_method: [],
    daily_cooking_time: "",

    kosher: false,
    allergies: [],
    allergies_text: [],
    dietary_style: "",
    meal_texture_preference: [],
    disliked_foods: [],
    liked_foods: [],
    regular_drinks: [],
    intermittent_fasting: false,
    fasting_hours: "",

    past_diet_difficulties: [],

    // Additional schema fields
    program_duration: "",
    meal_timing_restrictions: [],
    dietary_restrictions: [],
    willingness_to_follow: true,
    upcoming_events: [],
    upload_frequency: "",
    notifications_preference: [],
    personalized_tips: true,
    health_metrics_integration: false,
    family_medical_history: [],
    smoking_status: "",
    sleep_hours_per_night: "",
  });

  const handleArrayToggle = (
    array: string[],
    item: string,
    key: keyof QuestionnaireData
  ) => {
    const newArray = array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
    setFormData({ ...formData, [key]: newArray });
  };

  const handleSubmit = async () => {
    try {
      // Comprehensive validation
      const validationErrors = validateFormData(formData);
      if (validationErrors.length > 0) {
        Alert.alert(
          "שדות חסרים",
          "אנא מלא את השדות הבאים:\n" + validationErrors.join("\n"),
          [{ text: "OK" }]
        );
        return;
      }

      // Send raw formData as it matches QuestionnaireData type
      const result = await dispatch(saveQuestionnaire(formData));

      if (saveQuestionnaire.fulfilled.match(result)) {
        // Navigate immediately after successful save
        router.replace("/(tabs)");

        // Show success message without blocking navigation
        Alert.alert(
          "הצלחה!",
          "השאלון נשמר בהצלחה. תוכנית התזונה המותאמת אישית שלך נבנית ברקע.",
          [{ text: "הבנתי" }]
        );
      }
    } catch (error: any) {
      console.error("Questionnaire submission error:", error);

      // Provide more specific error handling
      if (error.message?.includes("Network Error")) {
        Alert.alert(
          "בעיית חיבור",
          "אין חיבור לשרת. אנא בדוק את החיבור לאינטרנט ונסה שוב."
        );
      } else {
        Alert.alert("שגיאה", "אירעה שגיאה בשמירת השאלון. אנא נסה שוב.");
      }
    }
  };

  const validateFormData = (data: QuestionnaireData): string[] => {
    const errors: string[] = [];

    // Required fields validation
    if (!data.age || parseInt(data.age) <= 0) {
      errors.push("• גיל תקין");
    }
    if (!data.gender || data.gender.trim() === "") {
      errors.push("• מגדר");
    }
    if (!data.height_cm || parseFloat(data.height_cm) <= 0) {
      errors.push("• גובה תקין");
    }
    if (!data.weight_kg || parseFloat(data.weight_kg) <= 0) {
      errors.push("• משקל תקין");
    }
    if (!data.main_goal || data.main_goal.trim() === "") {
      errors.push("• מטרה עיקרית");
    }
    if (
      !data.physical_activity_level ||
      data.physical_activity_level.trim() === ""
    ) {
      errors.push("• רמת פעילות גופנית");
    }
    if (!data.sport_frequency || data.sport_frequency.trim() === "") {
      errors.push("• תדירות ספורט");
    }
    if (!data.cooking_preference || data.cooking_preference.trim() === "") {
      errors.push("• העדפת בישול");
    }
    if (!data.dietary_style || data.dietary_style.trim() === "") {
      errors.push("• סגנון תזונה");
    }
    if (!data.commitment_level || data.commitment_level.trim() === "") {
      errors.push("• רמת מחויבות");
    }

    // Validate numeric ranges
    const age = parseInt(data.age);
    if (age > 0 && (age < 10 || age > 120)) {
      errors.push("• גיל בין 10 ל-120");
    }

    const height = parseFloat(data.height_cm);
    if (height > 0 && (height < 100 || height > 250)) {
      errors.push('• גובה בין 100 ל-250 ס"מ');
    }

    const weight = parseFloat(data.weight_kg);
    if (weight > 0 && (weight < 30 || weight > 300)) {
      errors.push('• משקל בין 30 ל-300 ק"ג');
    }

    return errors;
  };

  useEffect(() => {
    if (error) {
      Alert.alert("שגיאה", error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const renderProgress = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${progressPercentage}%` }]}
        />
      </View>
      <Text style={styles.progressText}>
        שלב {currentStep} מתוך {totalSteps} ({Math.round(progressPercentage)}%)
      </Text>
    </View>
  );

  const renderPersonalDataStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>נתונים אישיים</Text>
      <Text style={styles.stepDescription}>
        נתונים אלה יעזרו לנו לחשב את הצרכים הקלוריים שלך
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>גיל *</Text>
        <TextInput
          style={[
            styles.textInput,
            (!formData.age || parseInt(formData.age) <= 0) && styles.inputError,
          ]}
          value={formData.age.toString()}
          onChangeText={(text) => setFormData({ ...formData, age: text })}
          keyboardType="numeric"
          placeholder="הכנס גיל"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>מגדר *</Text>
        <View style={styles.optionGroup}>
          {["זכר", "נקבה", "אחר"].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                formData.gender === option && styles.optionButtonSelected,
              ]}
              onPress={() => setFormData({ ...formData, gender: option })}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.gender === option && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>גובה (ס"מ) *</Text>
        <TextInput
          style={[
            styles.textInput,
            (!formData.height_cm || parseFloat(formData.height_cm) <= 0) &&
              styles.inputError,
          ]}
          value={formData.height_cm}
          onChangeText={(text) => setFormData({ ...formData, height_cm: text })}
          keyboardType="numeric"
          placeholder="הכנס גובה"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>משקל נוכחי (ק"ג) *</Text>
        <TextInput
          style={[
            styles.textInput,
            (!formData.weight_kg || parseFloat(formData.weight_kg) <= 0) &&
              styles.inputError,
          ]}
          value={formData.weight_kg}
          onChangeText={(text) => setFormData({ ...formData, weight_kg: text })}
          keyboardType="numeric"
          placeholder="הכנס משקל נוכחי"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>משקל יעד (ק"ג)</Text>
        <TextInput
          style={styles.textInput}
          value={formData.target_weight_kg}
          onChangeText={(text) =>
            setFormData({ ...formData, target_weight_kg: text })
          }
          keyboardType="numeric"
          placeholder="הכנס משקל יעד (אופציונלי)"
        />
      </View>

      <DynamicListInput
        label="פרטים נוספים"
        placeholder="הוסף פרט נוסף..."
        value={
          Array.isArray(formData.additional_personal_info)
            ? formData.additional_personal_info
            : []
        }
        onValueChange={(value) =>
          setFormData({
            ...formData,
            additional_personal_info: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={5}
      />
    </View>
  );

  const renderGoalsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>יעדים</Text>
      <Text style={styles.stepDescription}>
        הגדרת יעדים ברורים תעזור לבניית תוכנית מותאמת אישית
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>מה המטרה העיקרית שלך? *</Text>
        <View style={styles.optionGroup}>
          {MAIN_GOALS.map((goal) => (
            <TouchableOpacity
              key={goal.key}
              style={[
                styles.optionButton,
                formData.main_goal === goal.key && styles.optionButtonSelected,
              ]}
              onPress={() => setFormData({ ...formData, main_goal: goal.key })}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.main_goal === goal.key && styles.optionTextSelected,
                ]}
              >
                {goal.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {formData.main_goal === "OTHER" && (
        <DynamicListInput
          label="פרט את המטרה שלך"
          placeholder="הוסף מטרה..."
          value={
            Array.isArray(formData.main_goal_text)
              ? formData.main_goal_text
              : []
          }
          onValueChange={(value) =>
            setFormData({
              ...formData,
              main_goal_text: Array.isArray(value) ? value : [value],
            })
          }
          maxItems={3}
        />
      )}

      <DynamicListInput
        label="מטרות ספציפיות"
        placeholder="הוסף מטרה ספציפית (לדוגמה: לרדת 5 ק״ג לקראת החתונה)..."
        value={
          Array.isArray(formData.specific_goal) ? formData.specific_goal : []
        }
        onValueChange={(value) =>
          setFormData({
            ...formData,
            specific_goal: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={5}
      />

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          תוך כמה זמן תרצה להגיע ליעד? (ימים)
        </Text>
        <TextInput
          style={styles.textInput}
          value={formData.goal_timeframe_days}
          onChangeText={(text) =>
            setFormData({ ...formData, goal_timeframe_days: text })
          }
          keyboardType="numeric"
          placeholder="לדוגמה: 90 ימים"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>באיזו רמת מחויבות תרצה לפעול? *</Text>
        <View style={styles.optionGroup}>
          {["קל", "ממוצע", "קפדני"].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.optionButton,
                formData.commitment_level === level &&
                  styles.optionButtonSelected,
              ]}
              onPress={() =>
                setFormData({ ...formData, commitment_level: level })
              }
            >
              <Text
                style={[
                  styles.optionText,
                  formData.commitment_level === level &&
                    styles.optionTextSelected,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderActivityStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>פעילות גופנית</Text>
      <Text style={styles.stepDescription}>
        מידע על הפעילות הגופנית שלך יעזור לחישוב הצרכים הקלוריים
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>רמת הפעילות הגופנית שלך *</Text>
        <View style={styles.optionGroup}>
          {PHYSICAL_ACTIVITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.key}
              style={[
                styles.optionButton,
                formData.physical_activity_level === level.key &&
                  styles.optionButtonSelected,
              ]}
              onPress={() =>
                setFormData({ ...formData, physical_activity_level: level.key })
              }
            >
              <Text
                style={[
                  styles.optionText,
                  formData.physical_activity_level === level.key &&
                    styles.optionTextSelected,
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>תדירות ספורט *</Text>
        <View style={styles.optionGroup}>
          {SPORT_FREQUENCIES.map((freq) => (
            <TouchableOpacity
              key={freq.key}
              style={[
                styles.optionButton,
                formData.sport_frequency === freq.key &&
                  styles.optionButtonSelected,
              ]}
              onPress={() =>
                setFormData({ ...formData, sport_frequency: freq.key })
              }
            >
              <Text
                style={[
                  styles.optionText,
                  formData.sport_frequency === freq.key &&
                    styles.optionTextSelected,
                ]}
              >
                {freq.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {formData.sport_frequency !== "NONE" && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>משך ממוצע של כל פעילות (דקות)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.sport_duration_min}
              onChangeText={(text) =>
                setFormData({ ...formData, sport_duration_min: text })
              }
              keyboardType="numeric"
              placeholder="לדוגמה: 45"
            />
          </View>

          <DynamicListInput
            label="סוגי פעילות"
            placeholder="הוסף סוג פעילות (לדוגמה: ריצה, כושר, יוגה)..."
            value={
              Array.isArray(formData.sport_types) ? formData.sport_types : []
            }
            onValueChange={(value: string[]) =>
              setFormData({
                ...formData,
                sport_types: Array.isArray(value) ? value : [value],
              })
            }
            maxItems={10}
          />

          <DynamicListInput
            label="זמני אימונים מועדפים"
            placeholder="הוסף זמן אימון (לדוגמה: בוקר, ערב)..."
            value={
              Array.isArray(formData.workout_times)
                ? formData.workout_times
                : []
            }
            onValueChange={(value: string[]) =>
              setFormData({
                ...formData,
                workout_times: Array.isArray(value) ? value : [value],
              })
            }
            maxItems={5}
          />

          <DynamicListInput
            label="מכשירי כושר"
            placeholder="הוסף מכשיר כושר (לדוגמה: שעון חכם, צמיד כושר)..."
            value={
              Array.isArray(formData.fitness_device_type)
                ? formData.fitness_device_type
                : []
            }
            onValueChange={(value: string[]) =>
              setFormData({
                ...formData,
                fitness_device_type: Array.isArray(value) ? value : [value],
              })
            }
            maxItems={5}
          />

          <DynamicListInput
            label="מידע נוסף על פעילות"
            placeholder="הוסף מידע נוסף..."
            value={
              Array.isArray(formData.additional_activity_info)
                ? formData.additional_activity_info
                : []
            }
            onValueChange={(value: string[]) =>
              setFormData({
                ...formData,
                additional_activity_info: Array.isArray(value)
                  ? value
                  : [value],
              })
            }
            maxItems={5}
          />
        </>
      )}
    </View>
  );

  const renderHealthStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>בריאות</Text>
      <Text style={styles.stepDescription}>
        מידע רפואי יעזור לנו להתאים את התזונה לצרכים המיוחדים שלך
      </Text>

      <DynamicListInput
        label="בעיות רפואיות"
        placeholder="הוסף בעיה רפואית (לדוגמה: סכרת, לחץ דם)..."
        value={
          Array.isArray(formData.medical_conditions_text)
            ? formData.medical_conditions_text
            : []
        }
        onValueChange={(value: string[]) =>
          setFormData({
            ...formData,
            medical_conditions_text: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={10}
      />

      <DynamicListInput
        label="תרופות קבועות"
        placeholder="הוסף תרופה..."
        value={Array.isArray(formData.medications) ? formData.medications : []}
        onValueChange={(value: string[]) =>
          setFormData({
            ...formData,
            medications: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={10}
      />

      <DynamicListInput
        label="יעדים בריאותיים"
        placeholder="הוסף יעד בריאותי (לדוגמה: הורדת כולסטרול)..."
        value={
          Array.isArray(formData.health_goals) ? formData.health_goals : []
        }
        onValueChange={(value: string[]) =>
          setFormData({
            ...formData,
            health_goals: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={8}
      />

      <DynamicListInput
        label="בעיות תפקודיות"
        placeholder="הוסף בעיה תפקודית (לדוגמה: עייפות, חוסר ערנות)..."
        value={
          Array.isArray(formData.functional_issues)
            ? formData.functional_issues
            : []
        }
        onValueChange={(value: string[]) =>
          setFormData({
            ...formData,
            functional_issues: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={8}
      />

      <DynamicListInput
        label="בעיות תזונתיות"
        placeholder="הוסף בעיה תזונתית..."
        value={
          Array.isArray(formData.food_related_medical_issues)
            ? formData.food_related_medical_issues
            : []
        }
        onValueChange={(value: string[]) =>
          setFormData({
            ...formData,
            food_related_medical_issues: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={8}
      />
    </View>
  );

  const renderMeansStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>אמצעים ותנאים</Text>
      <Text style={styles.stepDescription}>
        מידע על האמצעים והזמן הזמינים לך יעזור לבניית תפריט מעשי
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>כמה ארוחות ביום?</Text>
        <View style={styles.optionGroup}>
          {["2", "3", "4", "5", "6"].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.optionButton,
                formData.meals_per_day === num && styles.optionButtonSelected,
              ]}
              onPress={() => setFormData({ ...formData, meals_per_day: num })}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.meals_per_day === num && styles.optionTextSelected,
                ]}
              >
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>העדפת הכנה *</Text>
        <View style={styles.optionGroup}>
          {["מבושל", "קל הכנה", "מוכן מראש", "ללא בישול"].map((pref) => (
            <TouchableOpacity
              key={pref}
              style={[
                styles.optionButton,
                formData.cooking_preference === pref &&
                  styles.optionButtonSelected,
              ]}
              onPress={() =>
                setFormData({ ...formData, cooking_preference: pref })
              }
            >
              <Text
                style={[
                  styles.optionText,
                  formData.cooking_preference === pref &&
                    styles.optionTextSelected,
                ]}
              >
                {pref}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>אמצעי בישול זמינים *</Text>
        <View style={styles.checkboxGroup}>
          {COOKING_METHODS.map((method) => (
            <TouchableOpacity
              key={method}
              style={styles.checkboxItem}
              onPress={() =>
                handleArrayToggle(
                  formData.available_cooking_methods,
                  method,
                  "available_cooking_methods"
                )
              }
            >
              <View
                style={[
                  styles.checkbox,
                  formData.available_cooking_methods.includes(method) &&
                    styles.checkboxChecked,
                ]}
              >
                {formData.available_cooking_methods.includes(method) && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>{method}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>תקציב יומי לאוכל (₪)</Text>
        <TextInput
          style={styles.textInput}
          value={formData.daily_food_budget}
          onChangeText={(text) =>
            setFormData({ ...formData, daily_food_budget: text })
          }
          keyboardType="numeric"
          placeholder="לדוגמה: 50"
        />
      </View>

      <DynamicListInput
        label="זמני ארוחות"
        placeholder="הוסף זמן ארוחה (לדוגמה: 8:00, 13:00)..."
        value={Array.isArray(formData.meal_times) ? formData.meal_times : []}
        onValueChange={(value: string[]) =>
          setFormData({
            ...formData,
            meal_times: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={6}
      />

      <DynamicListInput
        label="שיטות קנייה"
        placeholder="הוסף שיטת קנייה (לדוגמה: סופרמרקט, שוק)..."
        value={
          Array.isArray(formData.shopping_method)
            ? formData.shopping_method
            : []
        }
        onValueChange={(value: string[]) =>
          setFormData({
            ...formData,
            shopping_method: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={5}
      />
    </View>
  );

  const renderLifestyleStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>אורח חיים ושגרה</Text>
      <Text style={styles.stepDescription}>
        מידע על השגרה היומית שלך יעזור לבניית תוכנית מעשית
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>כמה שעות שינה בלילה?</Text>
        <TextInput
          style={styles.textInput}
          value={formData.sleep_hours_per_night}
          onChangeText={(text) =>
            setFormData({ ...formData, sleep_hours_per_night: text })
          }
          keyboardType="numeric"
          placeholder="לדוגמה: 7-8 שעות"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>סטטוס עישון</Text>
        <View style={styles.optionGroup}>
          {["לא מעשן", "מעשן", "מעשן לשעבר", "עישון חברתי"].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.optionButton,
                formData.smoking_status === status &&
                  styles.optionButtonSelected,
              ]}
              onPress={() =>
                setFormData({ ...formData, smoking_status: status })
              }
            >
              <Text
                style={[
                  styles.optionText,
                  formData.smoking_status === status &&
                    styles.optionTextSelected,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <DynamicListInput
        label="היסטוריה רפואית משפחתית"
        placeholder="הוסף מחלה במשפחה (לדוגמה: סכרת, לחץ דם)..."
        value={
          Array.isArray(formData.family_medical_history)
            ? formData.family_medical_history
            : []
        }
        onValueChange={(value: string[]) =>
          setFormData({
            ...formData,
            family_medical_history: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={10}
      />

      <DynamicListInput
        label="הגבלות זמן ארוחות"
        placeholder="הוסף הגבלת זמן (לדוגמה: לא יכול לאכול לפני 9:00)..."
        value={
          Array.isArray(formData.meal_timing_restrictions)
            ? formData.meal_timing_restrictions
            : []
        }
        onValueChange={(value: string[]) =>
          setFormData({
            ...formData,
            meal_timing_restrictions: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={8}
      />
    </View>
  );

  const renderPreferencesStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>העדפות ומטרות נוספות</Text>
      <Text style={styles.stepDescription}>
        הגדרות אחרונות לתוכנית המותאמת אישית
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>משך התוכנית המועדף</Text>
        <View style={styles.optionGroup}>
          {["חודש", "3 חודשים", "6 חודשים", "שנה", "ללא הגבלה"].map(
            (duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.optionButton,
                  formData.program_duration === duration &&
                    styles.optionButtonSelected,
                ]}
                onPress={() =>
                  setFormData({ ...formData, program_duration: duration })
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.program_duration === duration &&
                      styles.optionTextSelected,
                  ]}
                >
                  {duration}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>תדירות העלאת ארוחות</Text>
        <View style={styles.optionGroup}>
          {["כל ארוחה", "פעם ביום", "כמה פעמים בשבוע", "פעם בשבוע"].map(
            (freq) => (
              <TouchableOpacity
                key={freq}
                style={[
                  styles.optionButton,
                  formData.upload_frequency === freq &&
                    styles.optionButtonSelected,
                ]}
                onPress={() =>
                  setFormData({ ...formData, upload_frequency: freq })
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.upload_frequency === freq &&
                      styles.optionTextSelected,
                  ]}
                >
                  {freq}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>מחויבות למילוי התוכנית</Text>
          <TouchableOpacity
            style={[
              styles.switch,
              formData.willingness_to_follow && styles.switchActive,
            ]}
            onPress={() =>
              setFormData({
                ...formData,
                willingness_to_follow: !formData.willingness_to_follow,
              })
            }
          >
            <View
              style={[
                styles.switchThumb,
                formData.willingness_to_follow && styles.switchThumbActive,
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>טיפים מותאמים אישית</Text>
          <TouchableOpacity
            style={[
              styles.switch,
              formData.personalized_tips && styles.switchActive,
            ]}
            onPress={() =>
              setFormData({
                ...formData,
                personalized_tips: !formData.personalized_tips,
              })
            }
          >
            <View
              style={[
                styles.switchThumb,
                formData.personalized_tips && styles.switchThumbActive,
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <DynamicListInput
        label="הגבלות תזונתיות נוספות"
        placeholder="הוסף הגבלה תזונתית..."
        value={
          Array.isArray(formData.dietary_restrictions)
            ? formData.dietary_restrictions
            : []
        }
        onValueChange={(value: string[]) =>
          setFormData({
            ...formData,
            dietary_restrictions: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={10}
      />

      <DynamicListInput
        label="העדפות התראות"
        placeholder="הוסף העדפת התראה (לדוגמה: בוקר, ערב)..."
        value={
          Array.isArray(formData.notifications_preference)
            ? formData.notifications_preference
            : []
        }
        onValueChange={(value: string[]) =>
          setFormData({
            ...formData,
            notifications_preference: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={5}
      />

      <DynamicListInput
        label="אירועים קרובים"
        placeholder="הוסף אירוע קרוב (לדוגמה: חתונה, חופשה)..."
        value={
          Array.isArray(formData.upcoming_events)
            ? formData.upcoming_events
            : []
        }
        onValueChange={(value: string[]) =>
          setFormData({
            ...formData,
            upcoming_events: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={8}
      />

      <DynamicListInput
        label="קשיים בדיאטות בעבר"
        placeholder="הוסף קושי שחווית (לדוגמה: רעב, חוסר זמן)..."
        value={
          Array.isArray(formData.past_diet_difficulties)
            ? formData.past_diet_difficulties
            : []
        }
        onValueChange={(value: string[]) =>
          setFormData({
            ...formData,
            past_diet_difficulties: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={10}
      />
    </View>
  );

  const renderDietaryStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>העדפות והגבלות תזונתיות</Text>
      <Text style={styles.stepDescription}>
        מידע על העדפותיך יעזור לבניית תפריט שתאהב לאכול
      </Text>

      <View style={styles.inputGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>שמירה על כשרות</Text>
          <TouchableOpacity
            style={[styles.switch, formData.kosher && styles.switchActive]}
            onPress={() =>
              setFormData({ ...formData, kosher: !formData.kosher })
            }
          >
            <View
              style={[
                styles.switchThumb,
                formData.kosher && styles.switchThumbActive,
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>אלרגיות</Text>
        <View style={styles.checkboxGroup}>
          {ALLERGENS.map((allergen) => (
            <TouchableOpacity
              key={allergen}
              style={styles.checkboxItem}
              onPress={() =>
                handleArrayToggle(formData.allergies, allergen, "allergies")
              }
            >
              <View
                style={[
                  styles.checkbox,
                  formData.allergies.includes(allergen) &&
                    styles.checkboxChecked,
                ]}
              >
                {formData.allergies.includes(allergen) && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>{allergen}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>סגנון תזונה מועדף *</Text>
        <View style={styles.optionGroup}>
          {DIETARY_STYLES.map((style) => (
            <TouchableOpacity
              key={style}
              style={[
                styles.optionButton,
                formData.dietary_style === style && styles.optionButtonSelected,
              ]}
              onPress={() => setFormData({ ...formData, dietary_style: style })}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.dietary_style === style && styles.optionTextSelected,
                ]}
              >
                {style}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <DynamicListInput
        label="אלרגיות נוספות"
        placeholder="הוסף אלרגיה נוספת..."
        value={
          Array.isArray(formData.allergies_text) ? formData.allergies_text : []
        }
        onValueChange={(value: string[]) =>
          setFormData({
            ...formData,
            allergies_text: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={10}
      />

      <DynamicListInput
        label="העדפות מרקם"
        placeholder="הוסף העדפת מרקם (לדוגמה: רך, פריך)..."
        value={
          Array.isArray(formData.meal_texture_preference)
            ? formData.meal_texture_preference
            : []
        }
        onValueChange={(value: string[]) =>
          setFormData({
            ...formData,
            meal_texture_preference: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={5}
      />

      <DynamicListInput
        label="מזונות שאינך אוהב"
        placeholder="הוסף מזון שאינך אוהב (לדוגמה: דגים, ירקות ירוקים)..."
        value={
          Array.isArray(formData.disliked_foods) ? formData.disliked_foods : []
        }
        onValueChange={(value: string[]) =>
          setFormData({
            ...formData,
            disliked_foods: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={15}
      />

      <DynamicListInput
        label="מזונות שאתה אוהב במיוחד"
        placeholder="הוסף מזון שאתה אוהב (לדוגמה: עוף, קינואה, אבוקדו)..."
        value={Array.isArray(formData.liked_foods) ? formData.liked_foods : []}
        onValueChange={(value: string[]) =>
          setFormData({
            ...formData,
            liked_foods: Array.isArray(value) ? value : [value],
          })
        }
        maxItems={15}
      />

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>משקאות שאתה שותה בקביעות</Text>
        <View style={styles.checkboxGroup}>
          {REGULAR_DRINKS.map((drink) => (
            <TouchableOpacity
              key={drink}
              style={styles.checkboxItem}
              onPress={() =>
                handleArrayToggle(
                  formData.regular_drinks,
                  drink,
                  "regular_drinks"
                )
              }
            >
              <View
                style={[
                  styles.checkbox,
                  formData.regular_drinks.includes(drink) &&
                    styles.checkboxChecked,
                ]}
              >
                {formData.regular_drinks.includes(drink) && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>{drink}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalDataStep();
      case 2:
        return renderGoalsStep();
      case 3:
        return renderActivityStep();
      case 4:
        return renderHealthStep();
      case 5:
        return renderMeansStep();
      case 6:
        return renderDietaryStep();
      case 7:
        return renderLifestyleStep();
      case 8:
        return renderPreferencesStep();
      default:
        return renderPersonalDataStep();
    }
  };

  // Load existing questionnaire data
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        // const token = await AsyncStorage.getItem("token");
        // if (!token) return;

        // const response = await api.get("/questionnaire");
        // if (response.data.success && response.data.data) {
        //   const existingData = response.data.data;
        const existingData = {
          age: "30",
          gender: "male",
          height_cm: "180",
          weight_kg: "80",
          target_weight_kg: "75",
          body_fat_percentage: "20",
          additional_personal_info: "None",
          main_goal: "WEIGHT_LOSS",
          main_goal_text: "",
          specific_goal: "Lose 5 kg",
          goal_timeframe_days: "90",
          commitment_level: "moderate",
          most_important_outcome: "health",
          special_personal_goal: "",
          physical_activity_level: "moderate",
          sport_frequency: "2-3 times a week",
          sport_types: ["running", "swimming"],
          sport_duration_min: "60",
          workout_times: "evening",
          uses_fitness_devices: true,
          fitness_device_type: "smartwatch",
          additional_activity_info: "",
          medical_conditions: ["none"],
          medical_conditions_text: "",
          medications: "None",
          health_goals: "Lower cholesterol",
          functional_issues: "None",
          food_related_medical_issues: "None",
          meals_per_day: "3",
          snacks_between_meals: false,
          meal_times: "8:00, 12:00, 18:00",
          cooking_preference: "easy",
          available_cooking_methods: ["oven", "stove"],
          daily_food_budget: "100",
          shopping_method: "supermarket",
          daily_cooking_time: "30",
          kosher: false,
          allergies: ["none"],
          allergies_text: "",
          dietary_style: "mediterranean",
          meal_texture_preference: "normal",
          disliked_foods: "olives",
          liked_foods: "chicken",
          regular_drinks: ["water", "coffee"],
          intermittent_fasting: false,
          fasting_hours: "",
          past_diet_difficulties: [],
        };

        // Convert numeric fields to strings for form compatibility
        const formattedData = {
          ...existingData,
          age: existingData.age?.toString() || "",
          height_cm: existingData.height_cm?.toString() || "",
          weight_kg: existingData.weight_kg?.toString() || "",
          target_weight_kg: existingData.target_weight_kg?.toString() || "",
          body_fat_percentage:
            existingData.body_fat_percentage?.toString() || "",
          goal_timeframe_days:
            existingData.goal_timeframe_days?.toString() || "",
          sport_duration_min: existingData.sport_duration_min?.toString() || "",
          meals_per_day: existingData.meals_per_day?.toString() || "",
          daily_food_budget: existingData.daily_food_budget?.toString() || "",
        };

        setFormData(formattedData);
        console.log("✅ Existing questionnaire data loaded");
        //  }
      } catch (error) {
        console.log(
          "⚠️ No existing questionnaire found or error loading:",
          error
        );
      }
    };

    loadExistingData();
  }, []);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.age &&
          parseInt(formData.age) > 0 &&
          formData.gender &&
          formData.gender.trim() !== "" &&
          formData.height_cm &&
          parseFloat(formData.height_cm) > 0 &&
          formData.weight_kg &&
          parseFloat(formData.weight_kg) > 0
        );
      case 2:
        return (
          formData.main_goal &&
          formData.main_goal.trim() !== "" &&
          formData.commitment_level &&
          formData.commitment_level.trim() !== ""
        );
      case 3:
        return (
          formData.physical_activity_level &&
          formData.physical_activity_level.trim() !== "" &&
          formData.sport_frequency &&
          formData.sport_frequency.trim() !== ""
        );
      case 4:
        return true; // Health step - all optional
      case 5:
        return (
          formData.cooking_preference &&
          formData.cooking_preference.trim() !== "" &&
          formData.available_cooking_methods &&
          formData.available_cooking_methods.length > 0
        );
      case 6:
        return formData.dietary_style && formData.dietary_style.trim() !== "";
      case 7:
        return true; // Lifestyle step - all optional
      case 8:
        return true; // Preferences step - all optional
      default:
        return true;
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      // Navigate to sibling page "payment-plan"
      router.replace("/payment-plan");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>בניית תוכנית אישית</Text>
        <View style={styles.placeholder} />
      </View>

      {renderProgress()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}

        <View style={styles.additionalInfo}>
          <Text style={styles.additionalInfoText}>
            💡 טיפ: כל המידע שלך מוצפן ומאובטח. נוכל לעדכן את התוכנית בכל עת לפי
            התקדמותך.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.navigation}>
        {currentStep < totalSteps ? (
          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceed() && styles.nextButtonDisabled,
            ]}
            onPress={() => setCurrentStep(currentStep + 1)}
            disabled={!canProceed()}
          >
            <Text style={styles.nextButtonText}>המשך</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.finishButton, isSaving && styles.nextButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.finishButtonText}>צור תוכנית אישית</Text>
                <Ionicons name="checkmark" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Tip Modal */}
      <Modal
        visible={!!showTip}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTip("")}
      >
        <View style={styles.tipModalOverlay}>
          <View style={styles.tipModalContent}>
            <Text style={styles.tipText}>{showTip}</Text>
            <TouchableOpacity
              style={styles.tipCloseButton}
              onPress={() => setShowTip("")}
            >
              <Text style={styles.tipCloseText}>הבנתי</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  containerRTL: {
    direction: "rtl",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e9ecef",
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  progress: {
    fontSize: 14,
    color: "#666",
  },
  progressRTL: {
    textAlign: "right",
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  titleRTL: {
    textAlign: "right",
  },
  stepDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 24,
    lineHeight: 24,
  },
  questionTextRTL: {
    textAlign: "right",
  },
  inputGroup: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: "white",
  },
  inputError: {
    borderColor: "#FF3B30",
    borderWidth: 2,
  },
  textInputRTL: {
    textAlign: "right",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  optionsContainer: {
    marginTop: 10,
  },
  optionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#e9ecef",
    backgroundColor: "white",
    marginBottom: 8,
  },
  optionButtonRTL: {
    flexDirection: "row-reverse",
  },
  optionButtonSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#007AFF",
  },
  selectedOption: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  optionTextRTL: {
    textAlign: "right",
  },
  optionTextSelected: {
    color: "white",
  },
  selectedOptionText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  checkboxGroup: {
    gap: 15,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 6,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#333",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 16,
    color: "#333",
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#e9ecef",
    padding: 2,
    justifyContent: "center",
  },
  switchActive: {
    backgroundColor: "#007AFF",
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    alignSelf: "flex-end",
  },
  additionalInfo: {
    margin: 20,
    padding: 15,
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  additionalInfoText: {
    fontSize: 14,
    color: "#1565c0",
    lineHeight: 20,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  navigation: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  navigationRTL: {
    flexDirection: "row-reverse",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 16,
    color: "#007AFF",
    marginLeft: 4,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: "#ccc",
  },
  nextButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  finishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#28a745",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  finishButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  tipModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  tipModalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    maxWidth: 300,
  },
  tipText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  tipCloseButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  tipCloseText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
