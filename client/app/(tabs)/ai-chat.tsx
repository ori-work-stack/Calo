import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Send,
  Bot,
  User,
  AlertTriangle,
  Shield,
  Heart,
  Sparkles,
  Clock,
  MessageCircle,
  Trash2,
  RotateCcw,
  Info,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";

const { width } = Dimensions.get("window");

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  hasWarning?: boolean;
  allergenWarning?: string[];
  suggestions?: string[];
}

interface UserProfile {
  allergies: string[];
  medicalConditions: string[];
  dietaryPreferences: string[];
  goals: string[];
}

export default function AIChatScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    allergies: ["nuts", "dairy"], // Mock data - should come from user profile
    medicalConditions: ["diabetes"],
    dietaryPreferences: ["vegetarian"],
    goals: ["lose_weight"],
  });
  const scrollViewRef = useRef<ScrollView>(null);

  const texts = {
    title: language === "he" ? "צ'אט AI תזונתי" : "Nutritional AI Chat",
    subtitle:
      language === "he"
        ? "קבל המלצות תזונה מותאמות אישית מהיועץ הדיגיטלי שלנו"
        : "Get personalized nutrition advice from our digital advisor",
    typePlaceholder:
      language === "he" ? "הקלד שאלתך כאן..." : "Type your question here...",
    send: language === "he" ? "שלח" : "Send",
    typing: language === "he" ? "AI מקליד..." : "AI is typing...",
    allergenWarning: language === "he" ? "אזהרת אלרגן!" : "Allergen Warning!",
    warningMessage:
      language === "he"
        ? "המלצה זו מכילה רכיבים שעלולים לגרום לך אלרגיה"
        : "This recommendation contains ingredients that may cause you allergies",
    clearChat: language === "he" ? "נקה צ'אט" : "Clear Chat",
    newConversation: language === "he" ? "שיחה חדשה" : "New Conversation",
    suggestions: language === "he" ? "הצעות" : "Suggestions",
    tryThese: language === "he" ? "נסה את אלה:" : "Try these:",
    noMessages:
      language === "he" ? "התחל שיחה חדשה" : "Start a new conversation",
    welcomeMessage:
      language === "he"
        ? "שלום! אני היועץ התזונתי הדיגיטלי שלך. אני כאן לעזור לך עם שאלות תזונה, תכנון ארוחות והמלצות מותאמות אישית. איך אוכל לעזור לך היום?"
        : "Hello! I'm your digital nutrition advisor. I'm here to help you with nutrition questions, meal planning, and personalized recommendations. How can I help you today?",
    commonQuestions:
      language === "he"
        ? [
            "איך אוכל לרדת במשקל בצורה בריאה?",
            "מה המינון היומי הממולץ של חלבון?",
            "אילו ירקות עשירים בוויטמין C?",
            "איך לתכנן תפריט צמחוני מאוזן?",
            "מה זה דיאטה קטוגנית?",
          ]
        : [
            "How can I lose weight healthily?",
            "What's the recommended daily protein intake?",
            "Which vegetables are rich in vitamin C?",
            "How to plan a balanced vegetarian menu?",
            "What is a ketogenic diet?",
          ],
  };

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          type: "bot",
          content: texts.welcomeMessage,
          timestamp: new Date(),
          suggestions: texts.commonQuestions,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when new message is added
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const checkForAllergens = (messageContent: string): string[] => {
    const allergenMap: Record<string, string[]> = {
      nuts: [
        "אגוזים",
        "בוטנים",
        "שקדים",
        "אגוז",
        "לוז",
        "nuts",
        "peanuts",
        "almonds",
        "walnuts",
      ],
      dairy: [
        "חלב",
        "גבינה",
        "יוגורט",
        "חמאה",
        "dairy",
        "milk",
        "cheese",
        "yogurt",
        "butter",
      ],
      gluten: [
        "חיטה",
        "קמח",
        "לחם",
        "פסטה",
        "wheat",
        "flour",
        "bread",
        "pasta",
        "gluten",
      ],
      eggs: ["ביצים", "ביצה", "eggs", "egg"],
      fish: ["דג", "דגים", "סלמון", "טונה", "fish", "salmon", "tuna"],
      soy: ["סויה", "טופו", "soy", "tofu"],
    };

    const foundAllergens: string[] = [];

    userProfile.allergies.forEach((allergy) => {
      if (allergenMap[allergy]) {
        const keywords = allergenMap[allergy];
        if (
          keywords.some((keyword) =>
            messageContent.toLowerCase().includes(keyword.toLowerCase())
          )
        ) {
          foundAllergens.push(allergy);
        }
      }
    });

    return foundAllergens;
  };

  const generateAIResponse = async (userMessage: string): Promise<Message> => {
    // Simulate API delay
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000)
    );

    // Create enhanced prompt with user profile information
    const allergyInfo =
      userProfile.allergies.length > 0
        ? language === "he"
          ? `המשתמש רגיש ל: ${userProfile.allergies.join(
              ", "
            )}. אל תציע רכיבים אלה. אם הוא שואל לגביהם - הסבר שמדובר במרכיב שהוא אלרגי אליו.`
          : `The user is allergic to: ${userProfile.allergies.join(
              ", "
            )}. Do not suggest these ingredients. If they ask about them - explain that these are ingredients they're allergic to.`
        : "";

    const medicalInfo =
      userProfile.medicalConditions.length > 0
        ? language === "he"
          ? `המשתמש סובל מ: ${userProfile.medicalConditions.join(
              ", "
            )}. התאם המלצות בהתאם.`
          : `The user has: ${userProfile.medicalConditions.join(
              ", "
            )}. Adjust recommendations accordingly.`
        : "";

    const dietaryInfo =
      userProfile.dietaryPreferences.length > 0
        ? language === "he"
          ? `העדפות תזונה: ${userProfile.dietaryPreferences.join(", ")}.`
          : `Dietary preferences: ${userProfile.dietaryPreferences.join(", ")}.`
        : "";

    const enhancedPrompt = `${allergyInfo} ${medicalInfo} ${dietaryInfo} שאלת המשתמש: ${userMessage}`;

    // Mock AI responses with allergen awareness
    const responses =
      language === "he"
        ? [
            "זוהי המלצה מצוינת! בהתחשב בפרופיל התזונתי שלך, אני מציע להוסיף ירקות עלים ירוקים עשירים בברזל וחלבונים צמחיים כמו קטניות.",
            "אני רואה שאתה מעוניין בדיאטה מאוזנת. חשוב לוודא שאתה מקבל מספיק חלבון, ויטמינים ומינרלים. האם תרצה שאמליץ על תפריט יומי?",
            "בהתבסס על המגבלות התזונתיות שלך, אני ממליץ על מקורות חלבון חלופיים כמו קינואה, עדשים וחמוס. זה יעזור לך להגיע ליעדים התזונתיים שלך.",
            "זה נשמע כמו בחירה חכמה! רק שים לב שהמוצר לא מכיל חומרים שאתה רגיש אליהם. תמיד כדאי לבדוק את רשימת הרכיבים.",
          ]
        : [
            "That's an excellent recommendation! Based on your nutritional profile, I suggest adding iron-rich leafy greens and plant proteins like legumes.",
            "I see you're interested in a balanced diet. It's important to ensure you get enough protein, vitamins and minerals. Would you like me to recommend a daily menu?",
            "Based on your dietary restrictions, I recommend alternative protein sources like quinoa, lentils and chickpeas. This will help you reach your nutritional goals.",
            "That sounds like a smart choice! Just make sure the product doesn't contain ingredients you're sensitive to. Always check the ingredient list.",
          ];

    let responseContent =
      responses[Math.floor(Math.random() * responses.length)];

    // Check for allergens in the response
    const allergens = checkForAllergens(responseContent);
    let hasWarning = false;

    // If allergens are detected, modify response
    if (allergens.length > 0) {
      hasWarning = true;
      const warningText =
        language === "he"
          ? `⚠️ שים לב: ההמלצה הזו מכילה ${allergens.join(
              ", "
            )} שאתה רגיש אליהם. אני ממליץ למצוא חלופות מתאימות.`
          : `⚠️ Warning: This recommendation contains ${allergens.join(
              ", "
            )} which you're allergic to. I recommend finding suitable alternatives.`;

      responseContent = warningText + "\n\n" + responseContent;
    }

    // Add suggestions for common questions
    const suggestions =
      language === "he"
        ? [
            "המלץ על ארוחת בוקר בריאה",
            "איך לעלות במשקל באופן בריא?",
            "מה השעות הטובות לאכילה?",
          ]
        : [
            "Recommend a healthy breakfast",
            "How to gain weight healthily?",
            "What are good eating times?",
          ];

    return {
      id: Date.now().toString(),
      type: "bot",
      content: responseContent,
      timestamp: new Date(),
      hasWarning,
      allergenWarning: allergens.length > 0 ? allergens : undefined,
      suggestions: Math.random() > 0.6 ? suggestions : undefined,
    };
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      const aiResponse = await generateAIResponse(userMessage.content);
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      Alert.alert("שגיאה", "אירעה שגיאה בתקשורת עם השרת");
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    Alert.alert(
      texts.clearChat,
      language === "he"
        ? "האם אתה בטוח שברצונך למחוק את השיחה?"
        : "Are you sure you want to clear the chat?",
      [
        { text: language === "he" ? "ביטול" : "Cancel", style: "cancel" },
        {
          text: texts.clearChat,
          style: "destructive",
          onPress: () => {
            setMessages([
              {
                id: "welcome",
                type: "bot",
                content: texts.welcomeMessage,
                timestamp: new Date(),
                suggestions: texts.commonQuestions,
              },
            ]);
          },
        },
      ]
    );
  };

  const selectSuggestion = (suggestion: string) => {
    setInputText(suggestion);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === "he" ? "he-IL" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = (message: Message) => {
    const isUser = message.type === "user";

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.botMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageContent,
            isUser ? styles.userMessage : styles.botMessage,
          ]}
        >
          {!isUser && (
            <View style={styles.botIcon}>
              <Bot size={16} color="#16A085" />
            </View>
          )}

          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.botBubble,
              message.hasWarning && styles.warningBubble,
            ]}
          >
            {message.hasWarning && (
              <View style={styles.warningHeader}>
                <AlertTriangle size={16} color="#E74C3C" />
                <Text style={styles.warningTitle}>{texts.allergenWarning}</Text>
              </View>
            )}

            <Text
              style={[
                styles.messageText,
                isUser ? styles.userMessageText : styles.botMessageText,
              ]}
            >
              {message.content}
            </Text>

            <Text
              style={[
                styles.messageTime,
                isUser ? styles.userMessageTime : styles.botMessageTime,
              ]}
            >
              {formatTime(message.timestamp)}
            </Text>
          </View>

          {isUser && (
            <View style={styles.userIcon}>
              <User size={16} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Suggestions */}
        {message.suggestions && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>{texts.tryThese}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.suggestionsRow}>
                {message.suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionPill}
                    onPress={() => selectSuggestion(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{texts.title}</Text>
          <Text style={styles.subtitle}>{texts.subtitle}</Text>
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={clearChat}>
          <Trash2 size={20} color="#E74C3C" />
        </TouchableOpacity>
      </View>

      {/* User Profile Summary */}
      <View style={styles.profileSummary}>
        <LinearGradient
          colors={["#16A08515", "#16A08505"]}
          style={styles.profileGradient}
        >
          <View style={styles.profileHeader}>
            <Shield size={16} color="#16A085" />
            <Text style={styles.profileTitle}>
              {language === "he" ? "פרופיל בטיחות" : "Safety Profile"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            {userProfile.allergies.length > 0 && (
              <View style={styles.profileItem}>
                <AlertTriangle size={12} color="#E74C3C" />
                <Text style={styles.profileItemText}>
                  {language === "he" ? "אלרגיות" : "Allergies"}:{" "}
                  {userProfile.allergies.join(", ")}
                </Text>
              </View>
            )}
            {userProfile.medicalConditions.length > 0 && (
              <View style={styles.profileItem}>
                <Heart size={12} color="#9B59B6" />
                <Text style={styles.profileItemText}>
                  {language === "he" ? "מצבים רפואיים" : "Medical conditions"}:{" "}
                  {userProfile.medicalConditions.join(", ")}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageCircle size={64} color="#BDC3C7" />
            <Text style={styles.emptyText}>{texts.noMessages}</Text>
          </View>
        ) : (
          messages.map(renderMessage)
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <View style={styles.botIcon}>
                <Bot size={16} color="#16A085" />
              </View>
              <View style={styles.typingDots}>
                <ActivityIndicator size="small" color="#7F8C8D" />
                <Text style={styles.typingText}>{texts.typing}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
      >
        <LinearGradient
          colors={["#FFFFFF", "#F8F9FA"]}
          style={styles.inputGradient}
        >
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={texts.typePlaceholder}
              placeholderTextColor="#BDC3C7"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isTyping) && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isTyping}
            >
              <LinearGradient
                colors={
                  !inputText.trim() || isTyping
                    ? ["#BDC3C7", "#95A5A6"]
                    : ["#16A085", "#1ABC9C"]
                }
                style={styles.sendButtonGradient}
              >
                <Send size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
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
  clearButton: {
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
  profileSummary: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  profileGradient: {
    padding: 16,
    borderRadius: 12,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  profileTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16A085",
    marginLeft: 6,
  },
  profileInfo: {
    gap: 6,
  },
  profileItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileItemText: {
    fontSize: 12,
    color: "#7F8C8D",
    marginLeft: 6,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#7F8C8D",
    marginTop: 16,
    textAlign: "center",
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  botMessageContainer: {
    alignItems: "flex-start",
  },
  messageContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    maxWidth: "85%",
  },
  userMessage: {
    flexDirection: "row-reverse",
  },
  botMessage: {
    flexDirection: "row",
  },
  botIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8F8F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  userIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#16A085",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    maxWidth: width - 120,
  },
  userBubble: {
    backgroundColor: "#16A085",
  },
  botBubble: {
    backgroundColor: "#FFFFFF",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  warningBubble: {
    borderWidth: 1,
    borderColor: "#E74C3C",
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FDEBEA",
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E74C3C",
    marginLeft: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  botMessageText: {
    color: "#2C3E50",
  },
  messageTime: {
    fontSize: 12,
    marginTop: 6,
  },
  userMessageTime: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
  },
  botMessageTime: {
    color: "#95A5A6",
  },
  suggestionsContainer: {
    marginTop: 12,
    marginLeft: 40,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#7F8C8D",
    marginBottom: 8,
  },
  suggestionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  suggestionPill: {
    backgroundColor: "#E8F8F5",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#16A085",
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#16A085",
  },
  typingContainer: {
    alignItems: "flex-start",
    marginBottom: 16,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginLeft: 8,
  },
  typingText: {
    fontSize: 14,
    color: "#7F8C8D",
    marginLeft: 8,
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  inputGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2C3E50",
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  sendButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
