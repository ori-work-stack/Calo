import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
  I18nManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../src/store";
import {
  fetchCalendarData,
  addEvent,
  deleteEvent,
  getStatistics,
  clearError,
} from "../../src/store/calendarSlice";
import { Ionicons } from "@expo/vector-icons";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Target,
  TrendingUp,
  TrendingDown,
  CircleCheck as CheckCircle,
  Circle as XCircle,
  Globe,
  Award,
  Flame,
  Scroll,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

interface DayData {
  date: string;
  calories_goal: number;
  calories_actual: number;
  protein_goal: number;
  protein_actual: number;
  carbs_goal: number;
  carbs_actual: number;
  fat_goal: number;
  fat_actual: number;
  meal_count: number;
  quality_score: number;
  water_intake_ml: number;
  events: Array<{
    id: string;
    title: string;
    type: string;
    created_at: string;
  }>;
}

interface MonthStats {
  totalDays: number;
  successfulDays: number;
  averageCompletion: number;
  bestStreak: number;
  currentStreak: number;
}

export default function CalendarScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    calendarData,
    statistics,
    isLoading,
    isAddingEvent,
    isDeletingEvent,
    error,
  } = useSelector((state: RootState) => state.calendar);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState("general");
  const [eventDescription, setEventDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [badges, setBadges] = useState([]);
  const [language, setLanguage] = useState<"he" | "en">("he");

  const texts = {
    he: {
      title: "לוח יעדים",
      subtitle: "עקוב אחרי ההתקדמות היומית שלך",
      monthlyStats: "סטטיסטיקות חודשיות",
      successfulDays: "ימים מוצלחים",
      averageCompletion: "ממוצע השלמה",
      bestStreak: "רצף הטוב ביותר",
      currentStreak: "רצף נוכחי",
      dayDetails: "פרטי היום",
      caloriesGoal: "יעד קלוריות",
      proteinGoal: "יעד חלבון",
      waterGoal: "יעד מים",
      consumed: "נצרך",
      goal: "יעד",
      deviation: "סטייה",
      over: "עודף",
      under: "חסר",
      goalMet: "יעד הושג!",
      goalNotMet: "יעד לא הושג",
      days: "ימים",
      kcal: 'קק"ל',
      g: "גר׳",
      ml: 'מ"ל',
      today: "היום",
      selectDay: "בחר יום לצפייה בפרטים",
      excellent: "מעולה!",
      good: "טוב!",
      needsImprovement: "צריך שיפור",
      monthNames: [
        "ינואר",
        "פברואר",
        "מרץ",
        "אפריל",
        "מאי",
        "יוני",
        "יולי",
        "אוגוסט",
        "ספטמבר",
        "אוקטובר",
        "נובמבר",
        "דצמבר",
      ],
      dayNames: ["א", "ב", "ג", "ד", "ה", "ו", "ש"],
    },
    en: {
      title: "Goal Calendar",
      subtitle: "Track your daily progress",
      monthlyStats: "Monthly Statistics",
      successfulDays: "Successful Days",
      averageCompletion: "Average Completion",
      bestStreak: "Best Streak",
      currentStreak: "Current Streak",
      dayDetails: "Day Details",
      caloriesGoal: "Calorie Goal",
      proteinGoal: "Protein Goal",
      waterGoal: "Water Goal",
      consumed: "Consumed",
      goal: "Goal",
      deviation: "Deviation",
      over: "Over",
      under: "Under",
      goalMet: "Goal Achieved!",
      goalNotMet: "Goal Not Met",
      days: "days",
      kcal: "kcal",
      g: "g",
      ml: "ml",
      today: "Today",
      selectDay: "Select a day to view details",
      excellent: "Excellent!",
      good: "Good!",
      needsImprovement: "Needs Improvement",
      monthNames: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      dayNames: ["S", "M", "T", "W", "T", "F", "S"],
    },
  };

  const t = texts[language];

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "he" ? "en" : "he"));
  };

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [
        { text: "OK", onPress: () => dispatch(clearError()) },
      ]);
    }
  }, [error, dispatch]);

  const loadCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    dispatch(fetchCalendarData({ year, month }));
    dispatch(getStatistics({ year, month }));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const dayData = calendarData[dateStr] || {
        date: dateStr,
        calories_goal: 2000,
        calories_actual: 0,
        protein_goal: 150,
        protein_actual: 0,
        carbs_goal: 250,
        carbs_actual: 0,
        fat_goal: 67,
        fat_actual: 0,
        meal_count: 0,
        quality_score: 0,
        water_intake_ml: 0,
        events: [],
      };
      days.push(dayData);
    }

    return days;
  };

  const getProgressPercentage = (actual: number, goal: number) => {
    if (goal === 0) return 0;
    return Math.min((actual / goal) * 100, 150); // Cap at 150% for display
  };

  const getDayColor = (dayData: DayData) => {
    const caloriesProgress = getProgressPercentage(
      dayData.calories_actual,
      dayData.calories_goal
    );

    if (caloriesProgress >= 110) return "#8B0000"; // Dark red for overeating
    if (caloriesProgress >= 100) return "#2ECC71"; // Green for goal achieved
    if (caloriesProgress >= 70) return "#F39C12"; // Orange for close to goal
    return "#E74C3C"; // Red for not achieved
  };

  const getProgressLabel = (dayData: DayData) => {
    const caloriesProgress = getProgressPercentage(
      dayData.calories_actual,
      dayData.calories_goal
    );

    if (caloriesProgress >= 110) return "Overeating";
    if (caloriesProgress >= 100) return t.goalMet;
    if (caloriesProgress >= 70) return "Close to Goal";
    return t.goalNotMet;
  };

  const getDayStatus = (dayData: DayData) => {
    const caloriesProgress = getProgressPercentage(
      dayData.calories_actual,
      dayData.calories_goal
    );

    if (caloriesProgress >= 100) return t.excellent;
    if (caloriesProgress >= 80) return t.good;
    return t.needsImprovement;
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
    setShowMonthPicker(false);
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    setCurrentDate(newDate);
    setShowYearPicker(false);
  };

  const generateYearRange = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  const months = t.monthNames;

  const handleDayPress = (dayData: DayData) => {
    setSelectedDay(dayData);
    setShowDayModal(true);
  };

  const handleAddEvent = (dateStr: string) => {
    setSelectedDate(dateStr);
    setEventTitle("");
    setEventType("general");
    setEventDescription("");
    setShowEventModal(true);
  };

  const submitEvent = async () => {
    if (!eventTitle.trim()) {
      Alert.alert("Error", "Please enter an event title");
      return;
    }

    try {
      await dispatch(
        addEvent({
          date: selectedDate,
          title: eventTitle.trim(),
          type: eventType,
          description: eventDescription.trim() || undefined,
        })
      ).unwrap();

      setShowEventModal(false);
      Alert.alert("Success", "Event added successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to add event");
    }
  };

  const handleDeleteEvent = async (eventId: string, date: string) => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await dispatch(deleteEvent({ eventId, date })).unwrap();
            Alert.alert("Success", "Event deleted successfully!");
          } catch (error) {
            Alert.alert("Error", "Failed to delete event");
          }
        },
      },
    ]);
  };

  const calculateMonthStats = (): MonthStats => {
    const days = getDaysInMonth().filter((day) => day !== null) as DayData[];
    const totalDays = days.length;
    const successfulDays = days.filter(
      (day) =>
        getProgressPercentage(day.calories_actual, day.calories_goal) >= 100
    ).length;
    const averageCompletion =
      days.reduce(
        (sum, day) =>
          sum + getProgressPercentage(day.calories_actual, day.calories_goal),
        0
      ) / totalDays;

    // Calculate streaks
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    for (let i = days.length - 1; i >= 0; i--) {
      const goalMet =
        getProgressPercentage(days[i].calories_actual, days[i].calories_goal) >=
        100;
      if (goalMet) {
        tempStreak++;
        if (i === days.length - 1 || currentStreak === 0) {
          currentStreak = tempStreak;
        }
      } else {
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
        tempStreak = 0;
        if (i === days.length - 1) {
          currentStreak = 0;
        }
      }
    }

    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }

    return {
      totalDays,
      successfulDays,
      averageCompletion,
      bestStreak,
      currentStreak,
    };
  };

  const monthStats = calculateMonthStats();

  const renderDay = (dayData: DayData | null, index: number) => {
    if (!dayData) {
      return <View key={index} style={[styles.dayCell, styles.emptyDay]} />;
    }

    const dayNumber = new Date(dayData.date).getDate();
    const progress = getProgressPercentage(
      dayData.calories_actual,
      dayData.calories_goal
    );
    const dayColor = getDayColor(dayData);
    const hasEvents = dayData.events.length > 0;
    const isToday =
      new Date().toDateString() === new Date(dayData.date).toDateString();
    const isSelected = selectedDay?.date === dayData.date;

    return (
      <TouchableOpacity
        key={dayData.date}
        style={[
          styles.dayCell,
          styles.dayButton,
          isToday && styles.todayCell,
          isSelected && styles.selectedCell,
        ]}
        onPress={() => handleDayPress(dayData)}
        onLongPress={() => handleAddEvent(dayData.date)}
      >
        <View style={[styles.dayIndicator, { backgroundColor: dayColor }]}>
          <Text style={styles.dayNumber}>{dayNumber}</Text>
        </View>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${Math.min(progress, 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        {hasEvents && (
          <View style={styles.eventIndicator}>
            <Ionicons name="star" size={8} color="#FFD700" />
            <Text style={styles.eventCount}>{dayData.events.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderWeekDays = () => {
    return (
      <View style={styles.weekDaysContainer}>
        {t.dayNames.map((day, index) => (
          <View key={index} style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderGamificationSection = () => {
    if (!statistics || !statistics.gamificationBadges?.length) return null;

    return (
      <View style={styles.section}>
        <View style={styles.gamificationContainer}>
          <LinearGradient
            colors={["#16A08515", "#16A08505"]}
            style={styles.statsGradient}
          >
            <View style={styles.gamificationHeader}>
              <Text style={styles.gamificationTitle}>
                🏆 Recent Achievements
              </Text>
              <TouchableOpacity onPress={() => setShowBadgesModal(true)}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {statistics.gamificationBadges.slice(0, 5).map((badge) => (
                <View key={badge.id} style={styles.badgeItem}>
                  <View style={styles.badgeIcon}>
                    <Text style={styles.badgeIconText}>{badge.icon}</Text>
                  </View>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                </View>
              ))}
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    );
  };

  const renderStatistics = () => {
    if (!statistics) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.monthlyStats}</Text>
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={["#16A08515", "#16A08505"]}
            style={styles.statsGradient}
          >
            <Text style={styles.motivationalMessage}>
              {statistics.motivationalMessage}
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <CheckCircle size={20} color="#2ECC71" />
                </View>
                <Text style={styles.statValue}>
                  {monthStats.successfulDays}/{monthStats.totalDays}
                </Text>
                <Text style={styles.statLabel}>{t.successfulDays}</Text>
              </View>

              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Target size={20} color="#3498DB" />
                </View>
                <Text style={styles.statValue}>
                  {Math.round(monthStats.averageCompletion)}%
                </Text>
                <Text style={styles.statLabel}>{t.averageCompletion}</Text>
              </View>

              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Award size={20} color="#F39C12" />
                </View>
                <Text style={styles.statValue}>{monthStats.bestStreak}</Text>
                <Text style={styles.statLabel}>{t.bestStreak}</Text>
              </View>

              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Flame size={20} color="#E74C3C" />
                </View>
                <Text style={styles.statValue}>{monthStats.currentStreak}</Text>
                <Text style={styles.statLabel}>{t.currentStreak}</Text>
              </View>
            </View>

            {statistics.weeklyInsights && (
              <TouchableOpacity
                style={styles.insightsButton}
                onPress={() => setShowInsightsModal(true)}
              >
                <Text style={styles.insightsButtonText}>
                  📊 View Weekly Insights
                </Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>
      </View>
    );
  };

  useEffect(() => {
    const loadBadges = async () => {
      try {
        // Simulate fetching user achievements
        const userStats = {
          daysTracked: 10,
          currentStreak: 7,
          healthyMealsCount: 12,
        };

        const calculatedBadges = [
          {
            id: 1,
            name: "First Week",
            icon: "🏆",
            earned: userStats?.daysTracked >= 7,
            description: "Complete your first week of tracking",
          },
          {
            id: 2,
            name: "Streak Master",
            icon: "🔥",
            earned: userStats?.currentStreak >= 5,
            description: "Maintain a 5-day streak",
          },
          {
            id: 3,
            name: "Healthy Choice",
            icon: "🥗",
            earned: userStats?.healthyMealsCount >= 10,
            description: "Log 10 healthy meals",
          },
        ];
        setBadges(calculatedBadges);
      } catch (error) {
        console.error("Failed to load badges:", error);
        setBadges([]);
      }
    };

    loadBadges();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#16A085" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.languageButton}
              onPress={toggleLanguage}
            >
              <Globe size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics */}
        {renderStatistics()}

        {/* Gamification Section */}
        {renderGamificationSection()}

        {/* Calendar Navigation */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth(-1)}
          >
            <ChevronLeft size={24} color="#7F8C8D" />
          </TouchableOpacity>

          <View style={styles.monthContainer}>
            <CalendarIcon size={20} color="#16A085" />
            <Text style={styles.monthText}>
              {t.monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth(1)}
          >
            <ChevronRight size={24} color="#7F8C8D" />
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <View style={styles.section}>
          <View style={styles.calendarContainer}>
            {renderWeekDays()}
            <View style={styles.daysGrid}>
              {getDaysInMonth().map((dayData, index) =>
                renderDay(dayData, index)
              )}
            </View>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.section}>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: "#2ECC71" }]}
              />
              <Text style={styles.legendText}>{t.goalMet}</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: "#F39C12" }]}
              />
              <Text style={styles.legendText}>80-99%</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: "#E74C3C" }]}
              />
              <Text style={styles.legendText}>{"<80%"}</Text>
            </View>
          </View>
        </View>

        {/* Day Details */}
        {selectedDay ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.dayDetails}</Text>
            <View style={styles.dayDetailsContainer}>
              <LinearGradient
                colors={[
                  `${getDayColor(selectedDay)}15`,
                  `${getDayColor(selectedDay)}05`,
                ]}
                style={styles.dayDetailsGradient}
              >
                <View style={styles.dayDetailsHeader}>
                  <View style={styles.dayDetailsDate}>
                    <Text style={styles.dayDetailsDateText}>
                      {new Date(selectedDay.date).getDate()}
                    </Text>
                    <Text style={styles.dayDetailsMonthText}>
                      {t.monthNames[new Date(selectedDay.date).getMonth()]}
                    </Text>
                  </View>
                  <View style={styles.dayDetailsStatus}>
                    {getProgressPercentage(
                      selectedDay.calories_actual,
                      selectedDay.calories_goal
                    ) >= 100 ? (
                      <CheckCircle size={24} color="#2ECC71" />
                    ) : (
                      <XCircle size={24} color="#E74C3C" />
                    )}
                    <Text
                      style={[
                        styles.dayDetailsStatusText,
                        { color: getDayColor(selectedDay) },
                      ]}
                    >
                      {getDayStatus(selectedDay)}
                    </Text>
                  </View>
                </View>

                <View style={styles.dayDetailsMetrics}>
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Flame size={16} color="#E74C3C" />
                      <Text style={styles.metricTitle}>{t.caloriesGoal}</Text>
                    </View>
                    <Text style={styles.metricValue}>
                      {selectedDay.calories_actual} /{" "}
                      {selectedDay.calories_goal} {t.kcal}
                    </Text>
                    <View style={styles.deviationContainer}>
                      {selectedDay.calories_actual >
                      selectedDay.calories_goal ? (
                        <TrendingUp size={14} color="#E74C3C" />
                      ) : (
                        <TrendingDown size={14} color="#3498DB" />
                      )}
                      <Text
                        style={[
                          styles.deviationValue,
                          {
                            color:
                              selectedDay.calories_actual >
                              selectedDay.calories_goal
                                ? "#E74C3C"
                                : "#3498DB",
                          },
                        ]}
                      >
                        {Math.abs(
                          selectedDay.calories_actual -
                            selectedDay.calories_goal
                        )}{" "}
                        {t.kcal}{" "}
                        {selectedDay.calories_actual > selectedDay.calories_goal
                          ? t.over
                          : t.under}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Target size={16} color="#9B59B6" />
                      <Text style={styles.metricTitle}>{t.proteinGoal}</Text>
                    </View>
                    <Text style={styles.metricValue}>
                      {selectedDay.protein_actual} / {selectedDay.protein_goal}{" "}
                      {t.g}
                    </Text>
                    <Text style={styles.metricPercentage}>
                      {Math.round(
                        (selectedDay.protein_actual /
                          selectedDay.protein_goal) *
                          100
                      )}
                      %
                    </Text>
                  </View>

                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Target size={16} color="#3498DB" />
                      <Text style={styles.metricTitle}>{t.waterGoal}</Text>
                    </View>
                    <Text style={styles.metricValue}>
                      {selectedDay.water_intake_ml} {t.ml}
                    </Text>
                  </View>
                </View>

                {selectedDay.events.length > 0 && (
                  <View style={styles.eventsSection}>
                    <Text style={styles.eventsTitle}>Events</Text>
                    {selectedDay.events.map((event) => (
                      <View key={event.id} style={styles.eventItem}>
                        <Ionicons name="calendar" size={16} color="#16A085" />
                        <Text style={styles.eventText}>{event.title}</Text>
                        <TouchableOpacity
                          style={styles.deleteEventButton}
                          onPress={() =>
                            handleDeleteEvent(event.id, selectedDay.date)
                          }
                          disabled={isDeletingEvent}
                        >
                          <Ionicons name="trash" size={16} color="#F44336" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.addEventButton]}
                    onPress={() => {
                      setSelectedDay(null);
                      handleAddEvent(selectedDay.date);
                    }}
                  >
                    <Text style={styles.addEventButtonText}>Add Event</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.selectDayContainer}>
              <CalendarIcon size={48} color="#BDC3C7" />
              <Text style={styles.selectDayText}>{t.selectDay}</Text>
            </View>
          </View>
        )}

        {/* Add Event Modal */}
        <Modal
          visible={showEventModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEventModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>Add Event</Text>

                <TextInput
                  style={styles.eventInput}
                  placeholder="Event title (e.g., Wedding, Heavy workout, Fasting day)"
                  value={eventTitle}
                  onChangeText={setEventTitle}
                  autoFocus={true}
                />

                <TextInput
                  style={[styles.eventInput, styles.eventDescriptionInput]}
                  placeholder="Description (optional)"
                  value={eventDescription}
                  onChangeText={setEventDescription}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.eventTypeContainer}>
                  <Text style={styles.eventTypeLabel}>Event Type:</Text>
                  <View style={styles.eventTypeButtons}>
                    {[
                      { key: "general", label: "General", icon: "calendar" },
                      { key: "workout", label: "Workout", icon: "fitness" },
                      { key: "social", label: "Social", icon: "people" },
                      { key: "health", label: "Health", icon: "medical" },
                      { key: "travel", label: "Travel", icon: "airplane" },
                      { key: "work", label: "Work", icon: "briefcase" },
                    ].map((type) => (
                      <TouchableOpacity
                        key={type.key}
                        style={[
                          styles.eventTypeButton,
                          eventType === type.key &&
                            styles.eventTypeButtonActive,
                        ]}
                        onPress={() => setEventType(type.key)}
                      >
                        <Ionicons
                          name={type.icon as any}
                          size={16}
                          color={eventType === type.key ? "#fff" : "#16A085"}
                        />
                        <Text
                          style={[
                            styles.eventTypeButtonText,
                            eventType === type.key &&
                              styles.eventTypeButtonTextActive,
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowEventModal(false)}
                    disabled={isAddingEvent}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitButton]}
                    onPress={submitEvent}
                    disabled={!eventTitle.trim() || isAddingEvent}
                  >
                    {isAddingEvent ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>Add Event</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Badges Modal */}
        <Modal
          visible={showBadgesModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowBadgesModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.badgesHeader}>
                <Text style={styles.modalTitle}>🏆 Your Achievements</Text>
                <TouchableOpacity onPress={() => setShowBadgesModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.badgesScrollView}>
                {badges.map((badge) => (
                  <View key={badge.id} style={styles.badgeDetailItem}>
                    <Text style={styles.badgeDetailIcon}>{badge.icon}</Text>
                    <View style={styles.badgeDetailContent}>
                      <Text style={styles.badgeDetailName}>{badge.name}</Text>
                      <Text style={styles.badgeDetailDescription}>
                        {badge.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Weekly Insights Modal */}
        <Modal
          visible={showInsightsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowInsightsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.insightsHeader}>
                <Text style={styles.modalTitle}>📊 Weekly Insights</Text>
                <TouchableOpacity onPress={() => setShowInsightsModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.insightsScrollView}>
                {statistics?.weeklyInsights?.bestWeekDetails && (
                  <View style={styles.insightCard}>
                    <Text style={styles.insightCardTitle}>🎯 Best Week</Text>
                    <Text style={styles.insightCardSubtitle}>
                      {statistics.weeklyInsights.bestWeekDetails.weekStart} to{" "}
                      {statistics.weeklyInsights.bestWeekDetails.weekEnd}
                    </Text>
                    <Text style={styles.insightCardValue}>
                      {Math.round(
                        statistics.weeklyInsights.bestWeekDetails
                          .averageProgress
                      )}
                      % average progress
                    </Text>
                    <View style={styles.insightHighlights}>
                      {statistics.weeklyInsights.bestWeekDetails.highlights.map(
                        (highlight, index) => (
                          <Text key={index} style={styles.insightHighlight}>
                            ✅ {highlight}
                          </Text>
                        )
                      )}
                    </View>
                  </View>
                )}

                {statistics?.weeklyInsights?.challengingWeekDetails && (
                  <View style={styles.insightCard}>
                    <Text style={styles.insightCardTitle}>
                      💪 Most Challenging Week
                    </Text>
                    <Text style={styles.insightCardSubtitle}>
                      {
                        statistics.weeklyInsights.challengingWeekDetails
                          .weekStart
                      }{" "}
                      to{" "}
                      {statistics.weeklyInsights.challengingWeekDetails.weekEnd}
                    </Text>
                    <Text style={styles.insightCardValue}>
                      {Math.round(
                        statistics.weeklyInsights.challengingWeekDetails
                          .averageProgress
                      )}
                      % average progress
                    </Text>
                    <View style={styles.insightChallenges}>
                      {statistics.weeklyInsights.challengingWeekDetails.challenges.map(
                        (challenge, index) => (
                          <Text key={index} style={styles.insightChallenge}>
                            🔍 {challenge}
                          </Text>
                        )
                      )}
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  subtitle: {
    fontSize: 16,
    color: "#7F8C8D",
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
  },
  languageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 16,
  },
  statsContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  statsGradient: {
    padding: 20,
  },
  motivationalMessage: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#16A085",
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  statItem: {
    alignItems: "center",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  statLabel: {
    fontSize: 12,
    color: "#7F8C8D",
    textAlign: "center",
    marginTop: 4,
  },
  gamificationContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  gamificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  gamificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
  },
  seeAllText: {
    color: "#16A085",
    fontSize: 14,
    fontWeight: "500",
  },
  badgeItem: {
    alignItems: "center",
    marginRight: 20,
    minWidth: 60,
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  badgeIconText: {
    fontSize: 20,
  },
  badgeName: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  monthContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginLeft: 8,
  },
  calendarContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  weekDaysContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  dayHeader: {
    width: (width - 72) / 7,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7F8C8D",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: (width - 72) / 7,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  emptyDay: {
    backgroundColor: "transparent",
  },
  dayButton: {
    borderRadius: 8,
  },
  todayCell: {
    backgroundColor: "#E8F8F5",
  },
  selectedCell: {
    backgroundColor: "#16A08520",
  },
  dayIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  progressContainer: {
    width: "80%",
    height: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 2,
    marginBottom: 2,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#16A085",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 8,
    color: "#666",
    fontWeight: "600",
  },
  eventIndicator: {
    position: "absolute",
    top: 2,
    right: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  eventCount: {
    fontSize: 8,
    color: "#FFD700",
    marginLeft: 2,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: "#7F8C8D",
  },
  dayDetailsContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  dayDetailsGradient: {
    padding: 20,
  },
  dayDetailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  dayDetailsDate: {
    alignItems: "center",
  },
  dayDetailsDateText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  dayDetailsMonthText: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  dayDetailsStatus: {
    alignItems: "center",
  },
  dayDetailsStatusText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  dayDetailsMetrics: {
    gap: 16,
  },
  metricCard: {
    backgroundColor: "rgba(255,255,255,0.8)",
    padding: 16,
    borderRadius: 12,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2C3E50",
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  metricPercentage: {
    fontSize: 14,
    fontWeight: "500",
    color: "#16A085",
  },
  deviationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  deviationValue: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  selectDayContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  selectDayText: {
    fontSize: 16,
    color: "#7F8C8D",
    marginTop: 16,
    textAlign: "center",
  },
  eventsSection: {
    marginTop: 20,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 10,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 8,
    marginBottom: 5,
  },
  eventText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  deleteEventButton: {
    padding: 5,
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
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  eventInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  eventDescriptionInput: {
    height: 80,
    textAlignVertical: "top",
  },
  eventTypeContainer: {
    marginBottom: 20,
  },
  eventTypeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  eventTypeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  eventTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#16A085",
    borderRadius: 8,
    backgroundColor: "white",
    minWidth: 100,
  },
  eventTypeButtonActive: {
    backgroundColor: "#16A085",
  },
  eventTypeButtonText: {
    marginLeft: 5,
    fontSize: 12,
    color: "#16A085",
  },
  eventTypeButtonTextActive: {
    color: "white",
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
  addEventButton: {
    backgroundColor: "#16A085",
  },
  addEventButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#16A085",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  badgesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  badgesScrollView: {
    maxHeight: 400,
  },
  badgeDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 10,
  },
  badgeDetailIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  badgeDetailContent: {
    flex: 1,
  },
  badgeDetailName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  badgeDetailDescription: {
    fontSize: 14,
    color: "#666",
  },
  insightsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  insightsScrollView: {
    maxHeight: 400,
  },
  insightCard: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  insightCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  insightCardSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  insightCardValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#16A085",
    marginBottom: 10,
  },
  insightHighlights: {
    marginTop: 10,
  },
  insightHighlight: {
    fontSize: 14,
    color: "#4CAF50",
    marginBottom: 5,
  },
  insightChallenges: {
    marginTop: 10,
  },
  insightChallenge: {
    fontSize: 14,
    color: "#FF9800",
    marginBottom: 5,
  },
  insightsButton: {
    backgroundColor: "rgba(255,255,255,0.8)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  insightsButtonText: {
    color: "#16A085",
    fontSize: 14,
    fontWeight: "600",
  },
});
