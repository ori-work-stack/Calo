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

interface QuestionnaireData {
  // Personal data
  age: string;
  gender: string;
  height_cm: string;
  weight_kg: string;
  target_weight_kg: string;
  body_fat_percentage: string;
  additional_personal_info: string;

  // Goals
  main_goal: string;
  main_goal_text: string;
  specific_goal: string;
  goal_timeframe_days: string;
  commitment_level: string;
  most_important_outcome: string;
  special_personal_goal: string;

  // Physical activity
  physical_activity_level: string;
  sport_frequency: string;
  sport_types: string[];
  sport_duration_min: string;
  workout_times: string;
  uses_fitness_devices: boolean;
  fitness_device_type: string;
  additional_activity_info: string;

  // Health
  medical_conditions: string[];
  medical_conditions_text: string;
  medications: string;
  health_goals: string;
  functional_issues: string;
  food_related_medical_issues: string;

  // Means and conditions
  meals_per_day: string;
  snacks_between_meals: boolean;
  meal_times: string;
  cooking_preference: string;
  available_cooking_methods: string[];
  daily_food_budget: string;
  shopping_method: string;
  daily_cooking_time: string;

  // Dietary preferences and restrictions
  kosher: boolean;
  allergies: string[];
  allergies_text: string;
  dietary_style: string;
  meal_texture_preference: string;
  disliked_foods: string;
  liked_foods: string;
  regular_drinks: string[];
  intermittent_fasting: boolean;
  fasting_hours: string;

  // Additional
  past_diet_difficulties: string;
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

  const totalSteps = 6;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const [formData, setFormData] = useState<QuestionnaireData>({
    // Initialize with user data where available
    age: user?.age?.toString() || "",
    gender: "",
    height_cm: user?.height_cm?.toString() || "",
    weight_kg: user?.weight_kg?.toString() || "",
    target_weight_kg: "",
    body_fat_percentage: "",
    additional_personal_info: "",

    main_goal: "",
    main_goal_text: "",
    specific_goal: "",
    goal_timeframe_days: "",
    commitment_level: "",
    most_important_outcome: "",
    special_personal_goal: "",

    physical_activity_level: "",
    sport_frequency: "",
    sport_types: [],
    sport_duration_min: "",
    workout_times: "",
    uses_fitness_devices: false,
    fitness_device_type: "",
    additional_activity_info: "",

    medical_conditions: [],
    medical_conditions_text: "",
    medications: "",
    health_goals: "",
    functional_issues: "",
    food_related_medical_issues: "",

    meals_per_day: "3",
    snacks_between_meals: false,
    meal_times: "",
    cooking_preference: "",
    available_cooking_methods: [],
    daily_food_budget: "",
    shopping_method: "",
    daily_cooking_time: "",

    kosher: false,
    allergies: [],
    allergies_text: "",
    dietary_style: "",
    meal_texture_preference: "",
    disliked_foods: "",
    liked_foods: "",
    regular_drinks: [],
    intermittent_fasting: false,
    fasting_hours: "",

    past_diet_difficulties: "",
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
      // Validate required fields
      if (!formData.age || !formData.gender || !formData.main_goal) {
        Alert.alert("שגיאה", "אנא מלא את כל השדות הנדרשים");
        return;
      }

      // Prepare data for API
      const questionnaireData = {
        ...formData,
        age: parseInt(formData.age),
        height_cm: formData.height_cm
          ? parseFloat(formData.height_cm)
          : undefined,
        weight_kg: formData.weight_kg
          ? parseFloat(formData.weight_kg)
          : undefined,
        target_weight_kg: formData.target_weight_kg
          ? parseFloat(formData.target_weight_kg)
          : undefined,
        sport_duration_min: formData.sport_duration_min
          ? parseInt(formData.sport_duration_min)
          : undefined,
        goal_timeframe_days: formData.goal_timeframe_days
          ? parseInt(formData.goal_timeframe_days)
          : undefined,
        meals_per_day: parseInt(formData.meals_per_day),
      };

      const result = await dispatch(saveQuestionnaire(questionnaireData));

      if (saveQuestionnaire.fulfilled.match(result)) {
        Alert.alert(
          "הצלחה!",
          "השאלון נשמר בהצלחה. אנחנו כעת בונים עבורך תוכנית תזונה מותאמת אישית.",
          [
            {
              text: "המשך",
              onPress: () => router.replace("/(tabs)"),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert("שגיאה", "אירעה שגיאה בשמירת השאלון");
    }
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
          style={styles.textInput}
          value={formData.age}
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
        <Text style={styles.inputLabel}>גובה (ס"מ)</Text>
        <TextInput
          style={styles.textInput}
          value={formData.height_cm}
          onChangeText={(text) => setFormData({ ...formData, height_cm: text })}
          keyboardType="numeric"
          placeholder="הכנס גובה"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>משקל נוכחי (ק"ג)</Text>
        <TextInput
          style={styles.textInput}
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

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>פרטים נוספים</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.additional_personal_info}
          onChangeText={(text) =>
            setFormData({ ...formData, additional_personal_info: text })
          }
          multiline
          numberOfLines={3}
          placeholder="פרטים רפואיים או אישיים נוספים שחשוב לדעת..."
        />
      </View>
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
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>פרט את המטרה שלך</Text>
          <TextInput
            style={styles.textInput}
            value={formData.main_goal_text}
            onChangeText={(text) =>
              setFormData({ ...formData, main_goal_text: text })
            }
            placeholder="תאר את המטרה העיקרית שלך..."
          />
        </View>
      )}

      <TextInput
        style={[styles.textInput, styles.textArea]}
        value={formData.specific_goal}
        onChangeText={(text) =>
          setFormData({ ...formData, specific_goal: text })
        }
        multiline
        numberOfLines={3}
        placeholder="מה המטרה שלך? לדוגמה: לרדת 5 ק״ג לקראת החתונה, לשפר סיבולת בריצה, להרגיש חטוב יותר..."
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
        <Text style={styles.inputLabel}>באיזו רמת מחויבות תרצה לפעול?</Text>
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
        <Text style={styles.inputLabel}>רמת הפעילות הגופנית שלך</Text>
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
        <Text style={styles.inputLabel}>תדירות ספורט</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>סוגי פעילות</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.sport_types.join(", ")}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  sport_types: text.split(", ").filter((item) => item.trim()),
                })
              }
              multiline
              numberOfLines={2}
              placeholder="לדוגמה: ריצה, כושר, יוגה, שחייה..."
            />
          </View>
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

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>האם קיימות בעיות רפואיות?</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.medical_conditions_text}
          onChangeText={(text) =>
            setFormData({ ...formData, medical_conditions_text: text })
          }
          multiline
          numberOfLines={3}
          placeholder="לדוגמה: סכרת, לחץ דם, כולסטרול גבוה, בעיות עיכול..."
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>האם אתה נוטל תרופות קבועות?</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.medications}
          onChangeText={(text) =>
            setFormData({ ...formData, medications: text })
          }
          multiline
          numberOfLines={2}
          placeholder="פרט את התרופות שאתה נוטל..."
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>יעדים בריאותיים</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.health_goals}
          onChangeText={(text) =>
            setFormData({ ...formData, health_goals: text })
          }
          multiline
          numberOfLines={2}
          placeholder="לדוגמה: הורדת כולסטרול, שיפור אנרגיה, שליטה ברמת סוכר..."
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>בעיות תפקודיות</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.functional_issues}
          onChangeText={(text) =>
            setFormData({ ...formData, functional_issues: text })
          }
          multiline
          numberOfLines={2}
          placeholder="עייפות, חוסר ערנות, הפרעות שינה, בעיות עיכול..."
        />
      </View>
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
        <Text style={styles.inputLabel}>העדפת הכנה</Text>
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
        <Text style={styles.inputLabel}>אמצעי בישול זמינים</Text>
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
        <Text style={styles.inputLabel}>סגנון תזונה מועדף</Text>
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

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>מזונות שאינך אוהב</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.disliked_foods}
          onChangeText={(text) =>
            setFormData({ ...formData, disliked_foods: text })
          }
          multiline
          numberOfLines={3}
          placeholder="לדוגמה: דגים, ירקות ירוקים, מזון חריף..."
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>מזונות שאתה אוהב במיוחד</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.liked_foods}
          onChangeText={(text) =>
            setFormData({ ...formData, liked_foods: text })
          }
          multiline
          numberOfLines={3}
          placeholder="לדוגמה: עוף, קינואה, אבוקדו, בטטה..."
        />
      </View>

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
      default:
        return renderPersonalDataStep();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.age && formData.gender;
      case 2:
        return formData.main_goal;
      default:
        return true;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            currentStep > 1 ? setCurrentStep(currentStep - 1) : router.back()
          }
        >
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
  stepDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  optionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#e9ecef",
    backgroundColor: "white",
  },
  optionButtonSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#007AFF",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  optionTextSelected: {
    color: "white",
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
  navigation: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
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
