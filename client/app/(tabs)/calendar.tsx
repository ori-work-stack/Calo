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
} from "react-native";
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

const { width } = Dimensions.get("window");
const CELL_SIZE = (width - 40) / 7; // 7 days per week

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
    if (caloriesProgress >= 100) return "#4CAF50"; // Green for goal achieved
    if (caloriesProgress >= 70) return "#FF9800"; // Orange for close to goal
    return "#F44336"; // Red for not achieved
  };

  const getProgressLabel = (dayData: DayData) => {
    const caloriesProgress = getProgressPercentage(
      dayData.calories_actual,
      dayData.calories_goal
    );

    if (caloriesProgress >= 110) return "Overeating";
    if (caloriesProgress >= 100) return "Goal Achieved";
    if (caloriesProgress >= 70) return "Close to Goal";
    return "Below Goal";
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

  const months = [
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
  ];

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

    return (
      <TouchableOpacity
        key={dayData.date}
        style={[
          styles.dayCell,
          { backgroundColor: dayColor },
          hasEvents && styles.dayWithEvents,
        ]}
        onPress={() => handleDayPress(dayData)}
        onLongPress={() => handleAddEvent(dayData.date)}
      >
        <Text style={styles.dayNumber}>{dayNumber}</Text>
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
        <Text style={styles.caloriesText}>
          {Math.round(dayData.calories_actual)}cal
        </Text>
        <Text style={styles.qualityScore}>Q: {dayData.quality_score}/10</Text>
      </TouchableOpacity>
    );
  };

  const renderWeekDays = () => {
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <View style={styles.weekDaysContainer}>
        {weekDays.map((day) => (
          <Text key={day} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>
    );
  };

  const renderGamificationSection = () => {
    if (!statistics || !statistics.gamificationBadges?.length) return null;

    return (
      <View style={styles.gamificationContainer}>
        <View style={styles.gamificationHeader}>
          <Text style={styles.gamificationTitle}>🏆 Recent Achievements</Text>
          <TouchableOpacity onPress={() => setShowBadgesModal(true)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {statistics.gamificationBadges.slice(0, 5).map((badge) => (
            <View key={badge.id} style={styles.badgeItem}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <Text style={styles.badgeName}>{badge.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderStatistics = () => {
    if (!statistics) return null;

    return (
      <View style={styles.statisticsContainer}>
        <Text style={styles.motivationalMessage}>
          {statistics.motivationalMessage}
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics.monthlyProgress}%</Text>
            <Text style={styles.statLabel}>Monthly Progress</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics.streakDays}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics.totalGoalDays}</Text>
            <Text style={styles.statLabel}>Goal Days</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {statistics.improvementPercent > 0 ? "+" : ""}
              {statistics.improvementPercent}%
            </Text>
            <Text style={styles.statLabel}>vs Last Month</Text>
          </View>
        </View>

        <View style={styles.averagesGrid}>
          <View style={styles.averageItem}>
            <Text style={styles.averageValue}>
              {statistics.averageCalories}
            </Text>
            <Text style={styles.averageLabel}>Avg Calories</Text>
          </View>
          <View style={styles.averageItem}>
            <Text style={styles.averageValue}>
              {statistics.averageProtein}g
            </Text>
            <Text style={styles.averageLabel}>Avg Protein</Text>
          </View>
          <View style={styles.averageItem}>
            <Text style={styles.averageValue}>{statistics.averageWater}ml</Text>
            <Text style={styles.averageLabel}>Avg Water</Text>
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
          },
          {
            id: 2,
            name: "Streak Master",
            icon: "🔥",
            earned: userStats?.currentStreak >= 5,
          },
          {
            id: 3,
            name: "Healthy Choice",
            icon: "🥗",
            earned: userStats?.healthyMealsCount >= 10,
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
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateMonth(-1)}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>

        <View style={styles.dateNavigationContainer}>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => setShowMonthPicker(true)}
          >
            <Text style={styles.monthTitle}>
              {currentDate.toLocaleDateString("en-US", { month: "long" })}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.yearButton}
            onPress={() => setShowYearPicker(true)}
          >
            <Text style={styles.yearTitle}>{currentDate.getFullYear()}</Text>
            <Ionicons name="chevron-down" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigateMonth(1)}>
          <Ionicons name="chevron-forward" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      {renderStatistics()}

      {/* Gamification Section */}
      {renderGamificationSection()}

      {/* Calendar */}
      <ScrollView>
        <View style={styles.calendarContainer}>
          {renderWeekDays()}
          <View style={styles.daysGrid}>
            {getDaysInMonth().map((dayData, index) =>
              renderDay(dayData, index)
            )}
          </View>
        </View>
      </ScrollView>

      {/* Enhanced Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendGrid}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#4CAF50" }]}
            />
            <Text style={styles.legendText}>Goal Achieved (100%+)</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#FF9800" }]}
            />
            <Text style={styles.legendText}>Close to Goal (70-99%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#F44336" }]}
            />
            <Text style={styles.legendText}>Below Goal (&lt;70%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: "#8B0000" }]}
            />
            <Text style={styles.legendText}>Overeating (110%+)</Text>
          </View>
        </View>
        <View style={styles.legendNote}>
          <Text style={styles.legendNoteText}>
            💡 Tap day for details • Long press to add event • ⭐ = has events
          </Text>
        </View>
      </View>

      {/* Day Detail Modal */}
      <Modal
        visible={showDayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              {selectedDay && (
                <>
                  <Text style={styles.modalTitle}>
                    {new Date(selectedDay.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>

                  <View style={styles.dayOverview}>
                    <Text style={styles.dayStatus}>
                      {getProgressLabel(selectedDay)}
                    </Text>
                    <Text style={styles.dayProgress}>
                      {Math.round(
                        getProgressPercentage(
                          selectedDay.calories_actual,
                          selectedDay.calories_goal
                        )
                      )}
                      % of daily goal
                    </Text>
                  </View>

                  <View style={styles.dayDetailGrid}>
                    <View style={styles.macroItem}>
                      <Text style={styles.macroLabel}>Calories</Text>
                      <Text style={styles.macroValue}>
                        {Math.round(selectedDay.calories_actual)} /{" "}
                        {selectedDay.calories_goal}
                      </Text>
                      <View style={styles.macroProgress}>
                        <View
                          style={[
                            styles.macroProgressBar,
                            {
                              width: `${Math.min(
                                getProgressPercentage(
                                  selectedDay.calories_actual,
                                  selectedDay.calories_goal
                                ),
                                100
                              )}%`,
                              backgroundColor: getDayColor(selectedDay),
                            },
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.macroItem}>
                      <Text style={styles.macroLabel}>Protein</Text>
                      <Text style={styles.macroValue}>
                        {Math.round(selectedDay.protein_actual)}g /{" "}
                        {selectedDay.protein_goal}g
                      </Text>
                      <View style={styles.macroProgress}>
                        <View
                          style={[
                            styles.macroProgressBar,
                            {
                              width: `${Math.min(
                                getProgressPercentage(
                                  selectedDay.protein_actual,
                                  selectedDay.protein_goal
                                ),
                                100
                              )}%`,
                              backgroundColor: "#2196F3",
                            },
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.macroItem}>
                      <Text style={styles.macroLabel}>Carbs</Text>
                      <Text style={styles.macroValue}>
                        {Math.round(selectedDay.carbs_actual)}g /{" "}
                        {selectedDay.carbs_goal}g
                      </Text>
                      <View style={styles.macroProgress}>
                        <View
                          style={[
                            styles.macroProgressBar,
                            {
                              width: `${Math.min(
                                getProgressPercentage(
                                  selectedDay.carbs_actual,
                                  selectedDay.carbs_goal
                                ),
                                100
                              )}%`,
                              backgroundColor: "#FF9800",
                            },
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.macroItem}>
                      <Text style={styles.macroLabel}>Fat</Text>
                      <Text style={styles.macroValue}>
                        {Math.round(selectedDay.fat_actual)}g /{" "}
                        {selectedDay.fat_goal}g
                      </Text>
                      <View style={styles.macroProgress}>
                        <View
                          style={[
                            styles.macroProgressBar,
                            {
                              width: `${Math.min(
                                getProgressPercentage(
                                  selectedDay.fat_actual,
                                  selectedDay.fat_goal
                                ),
                                100
                              )}%`,
                              backgroundColor: "#9C27B0",
                            },
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.macroItem}>
                      <Text style={styles.macroLabel}>Water</Text>
                      <Text style={styles.macroValue}>
                        {Math.round(selectedDay.water_intake_ml)}ml
                      </Text>
                    </View>
                  </View>

                  {selectedDay.events.length > 0 && (
                    <View style={styles.eventsSection}>
                      <Text style={styles.eventsTitle}>Events</Text>
                      {selectedDay.events.map((event) => (
                        <View key={event.id} style={styles.eventItem}>
                          <Ionicons name="calendar" size={16} color="#007AFF" />
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
                        setShowDayModal(false);
                        handleAddEvent(selectedDay.date);
                      }}
                    >
                      <Text style={styles.addEventButtonText}>Add Event</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.closeButton]}
                      onPress={() => setShowDayModal(false)}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Enhanced Add Event Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
                      eventType === type.key && styles.eventTypeButtonActive,
                    ]}
                    onPress={() => setEventType(type.key)}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={16}
                      color={eventType === type.key ? "#fff" : "#007AFF"}
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
              {statistics?.weeklyInsights.bestWeekDetails && (
                <View style={styles.insightCard}>
                  <Text style={styles.insightCardTitle}>🎯 Best Week</Text>
                  <Text style={styles.insightCardSubtitle}>
                    {statistics.weeklyInsights.bestWeekDetails.weekStart} to{" "}
                    {statistics.weeklyInsights.bestWeekDetails.weekEnd}
                  </Text>
                  <Text style={styles.insightCardValue}>
                    {Math.round(
                      statistics.weeklyInsights.bestWeekDetails.averageProgress
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

              {statistics?.weeklyInsights.challengingWeekDetails && (
                <View style={styles.insightCard}>
                  <Text style={styles.insightCardTitle}>
                    💪 Most Challenging Week
                  </Text>
                  <Text style={styles.insightCardSubtitle}>
                    {statistics.weeklyInsights.challengingWeekDetails.weekStart}{" "}
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

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={months}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    currentDate.getMonth() === index &&
                      styles.selectedPickerItem,
                  ]}
                  onPress={() => handleMonthSelect(index)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      currentDate.getMonth() === index &&
                        styles.selectedPickerItemText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Year</Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={generateYearRange()}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    currentDate.getFullYear() === item &&
                      styles.selectedPickerItem,
                  ]}
                  onPress={() => handleYearSelect(item)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      currentDate.getFullYear() === item &&
                        styles.selectedPickerItemText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              getItemLayout={(data, index) => ({
                length: 50,
                offset: 50 * index,
                index,
              })}
              initialScrollIndex={generateYearRange().findIndex(
                (year) => year === currentDate.getFullYear()
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
    padding: 20,
    backgroundColor: "white",
  },
  dateNavigationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  monthButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    gap: 4,
  },
  yearButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    gap: 4,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  yearTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  pickerModalContent: {
    backgroundColor: "white",
    marginHorizontal: 30,
    marginVertical: 100,
    borderRadius: 16,
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  pickerItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedPickerItem: {
    backgroundColor: "#007AFF",
  },
  pickerItemText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  selectedPickerItemText: {
    color: "#fff",
    fontWeight: "600",
  },
  statisticsContainer: {
    backgroundColor: "white",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  motivationalMessage: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#007AFF",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  averagesGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  averageItem: {
    alignItems: "center",
  },
  averageValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  averageLabel: {
    fontSize: 11,
    color: "#666",
  },
  insightsButton: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  insightsButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  gamificationContainer: {
    backgroundColor: "white",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: "#333",
  },
  seeAllText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  badgeItem: {
    alignItems: "center",
    marginRight: 20,
    minWidth: 60,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  badgeName: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  calendarContainer: {
    backgroundColor: "white",
    margin: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weekDaysContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    width: CELL_SIZE,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    padding: 1,
    margin: 1,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "space-between",
  },
  emptyDay: {
    backgroundColor: "transparent",
  },
  dayWithEvents: {
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  progressContainer: {
    width: "80%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 8,
    color: "white",
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
  caloriesText: {
    fontSize: 8,
    color: "white",
  },
  qualityScore: {
    fontSize: 7,
    color: "white",
    fontWeight: "600",
  },
  legendContainer: {
    backgroundColor: "white",
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  legendNote: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  legendNoteText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 16,
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
  dayOverview: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: "center",
  },
  dayStatus: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  dayProgress: {
    fontSize: 14,
    color: "#666",
  },
  dayDetailGrid: {
    marginBottom: 20,
  },
  macroItem: {
    marginBottom: 15,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  macroValue: {
    fontSize: 16,
    color: "#007AFF",
    marginBottom: 5,
  },
  macroProgress: {
    width: "100%",
    height: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
  },
  macroProgressBar: {
    height: "100%",
    borderRadius: 3,
  },
  dayStats: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  dayStatsText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  eventsSection: {
    marginBottom: 20,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f0f8ff",
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
    borderColor: "#007AFF",
    borderRadius: 8,
    backgroundColor: "white",
    minWidth: 100,
  },
  eventTypeButtonActive: {
    backgroundColor: "#007AFF",
  },
  eventTypeButtonText: {
    marginLeft: 5,
    fontSize: 12,
    color: "#007AFF",
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
    backgroundColor: "#007AFF",
  },
  addEventButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  closeButtonText: {
    color: "#333",
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
    backgroundColor: "#007AFF",
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
    marginBottom: 5,
  },
  badgeDetailDate: {
    fontSize: 12,
    color: "#999",
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
    color: "#007AFF",
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
});
