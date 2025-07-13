import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { chatAPI } from "../../src/services/api";

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function AIChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"he" | "en">("he");
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const languageOptions = [
    { key: "he", label: "עברית", flag: "🇮🇱" },
    { key: "en", label: "English", flag: "🇺🇸" },
  ];

  useEffect(() => {
    loadChatHistory();
    showChat();
  }, []);

  const showChat = () => {
    setIsVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideChat = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
    });
  };

  const loadChatHistory = async () => {
    try {
      const response = await chatAPI.getChatHistory(20);
      if (response.success && response.data) {
        const historyMessages: ChatMessage[] = [];
        response.data.forEach((msg: any) => {
          historyMessages.push({
            id: `user-${msg.message_id}`,
            type: "user",
            content: msg.user_message,
            timestamp: new Date(msg.created_at),
          });
          historyMessages.push({
            id: `ai-${msg.message_id}`,
            type: "ai",
            content: msg.ai_response,
            timestamp: new Date(msg.created_at),
          });
        });
        setMessages(historyMessages);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await chatAPI.sendMessage(
        userMessage.content,
        selectedLanguage
      );

      if (response.success && response.data) {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: "ai",
          content: response.data.response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(response.error || "Failed to get AI response");
      }
    } catch (error) {
      console.error("Failed to send message:", error);

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: "ai",
        content:
          selectedLanguage === "he"
            ? "מצטער, אני לא זמין כרגע. אנא נסה שוב מאוחר יותר."
            : "Sorry, I'm not available right now. Please try again later.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    Alert.alert(
      selectedLanguage === "he" ? "מחיקת היסטוריה" : "Clear History",
      selectedLanguage === "he"
        ? "האם אתה בטוח שברצונך למחוק את כל השיחה?"
        : "Are you sure you want to delete the entire conversation?",
      [
        {
          text: selectedLanguage === "he" ? "ביטול" : "Cancel",
          style: "cancel",
        },
        {
          text: selectedLanguage === "he" ? "מחק" : "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await chatAPI.clearHistory();
              setMessages([]);
            } catch (error) {
              console.error("Failed to clear history:", error);
            }
          },
        },
      ]
    );
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isVisible) return null;

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ translateX }],
        },
      ]}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.aiIndicator}>
                <Text style={styles.aiIndicatorText}>AI</Text>
              </View>
              <Text style={styles.headerTitle}>
                {selectedLanguage === "he" ? "יועץ תזונה" : "Nutrition Advisor"}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.languageSelector}>
                {languageOptions.map((lang) => (
                  <TouchableOpacity
                    key={lang.key}
                    style={[
                      styles.languageButton,
                      selectedLanguage === lang.key &&
                        styles.languageButtonActive,
                    ]}
                    onPress={() => setSelectedLanguage(lang.key as "he" | "en")}
                  >
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={clearHistory}
              >
                <Ionicons name="trash-outline" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={hideChat}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Warning */}
          <View style={styles.warning}>
            <Ionicons name="information-circle" size={16} color="#f39c12" />
            <Text style={styles.warningText}>
              ⚠️{" "}
              {selectedLanguage === "he"
                ? "זהו ייעוץ כללי ולא תחליף לייעוץ רפואי מוסמך"
                : "This is general advice and not a substitute for qualified medical advice"}
            </Text>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 && (
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeTitle}>
                  {selectedLanguage === "he" ? "שלום! 👋" : "Hello! 👋"}
                </Text>
                <Text style={styles.welcomeText}>
                  {selectedLanguage === "he"
                    ? "אני יועץ התזונה הדיגיטלי שלך. אתה יכול לשאול אותי על:"
                    : "I'm your digital nutrition advisor. You can ask me about:"}
                </Text>
                <View style={styles.examplesList}>
                  <Text style={styles.exampleItem}>
                    •{" "}
                    {selectedLanguage === "he"
                      ? "ערכים תזונתיים של מזונות"
                      : "Nutritional values ​​of food"}
                  </Text>
                  <Text style={styles.exampleItem}>
                    •{" "}
                    {selectedLanguage === "he"
                      ? "המלצות לארוחות"
                      : "Meal recommendations"}
                  </Text>
                  <Text style={styles.exampleItem}>
                    •{" "}
                    {selectedLanguage === "he"
                      ? "טיפים לבישול בריא"
                      : "Tips for healthy cooking"}
                  </Text>
                  <Text style={styles.exampleItem}>
                    •{" "}
                    {selectedLanguage === "he"
                      ? "בירורים תזונתיים כלליים"
                      : "General nutritional inquiries"}
                  </Text>
                </View>
              </View>
            )}

            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.type === "user"
                    ? styles.userMessage
                    : styles.aiMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.type === "user"
                      ? styles.userMessageText
                      : styles.aiMessageText,
                  ]}
                >
                  {message.content}
                </Text>
                <Text style={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString(
                    selectedLanguage === "he" ? "he-IL" : "en-US",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </Text>
              </View>
            ))}

            {isLoading && (
              <View style={[styles.messageContainer, styles.aiMessage]}>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                selectedLanguage === "he"
                  ? "שאל שאלה תזונתית..."
                  : "Ask a nutritional question..."
              }
              multiline
              maxLength={500}
              editable={!isLoading}
              textAlign={selectedLanguage === "he" ? "right" : "left"}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons
                name="send"
                size={20}
                color={!inputText.trim() || isLoading ? "#ccc" : "#007AFF"}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
    zIndex: 1000,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#f8f9fa",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiIndicator: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  aiIndicatorText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  headerRight: {
    flexDirection: "row",
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff3cd",
    borderBottomWidth: 1,
    borderBottomColor: "#ffeeba",
  },
  warningText: {
    fontSize: 12,
    color: "#856404",
    marginLeft: 6,
    flex: 1,
    textAlign: "right",
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcomeContainer: {
    padding: 20,
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 22,
  },
  examplesList: {
    alignSelf: "stretch",
  },
  exampleItem: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    textAlign: "right",
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f1f1",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#fff",
    textAlign: "right",
  },
  aiMessageText: {
    color: "#333",
    textAlign: "right",
  },
  messageTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "right",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#666",
    marginHorizontal: 2,
    // Add animation here if needed
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    textAlign: "right",
  },
  sendButton: {
    marginLeft: 8,
    padding: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  placeholder: {
    width: 40,
  },
  languageSelector: {
    flexDirection: "row",
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  languageButtonActive: {
    backgroundColor: "#007AFF",
  },
  languageFlag: {
    fontSize: 16,
  },
});
