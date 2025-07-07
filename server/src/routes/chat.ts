import express from "express";
import { authenticateToken } from "../middleware/auth";
import { ChatService } from "../services/chat";

const router = express.Router();

router.use(authenticateToken);

// Send message to AI chat
router.post("/message", async (req, res) => {
  try {
    const { message, language = "hebrew" } = req.body;
    const userId = req.user?.user_id;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated or user ID missing.",
      });
    }
    const response = await ChatService.processMessage(
      userId,
      message,
      language
    );

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process chat message",
    });
  }
});

// Get chat history
router.get("/history", async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { limit = 50 } = req.query;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated or user ID missing.",
      });
    }
    const history = await ChatService.getChatHistory(userId, Number(limit));

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Chat history API error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get chat history",
    });
  }
});

// Clear chat history
router.delete("/history", async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated or user ID missing.",
      });
    }
    await ChatService.clearChatHistory(userId);

    res.json({
      success: true,
      message: "Chat history cleared",
    });
  } catch (error) {
    console.error("Clear chat history API error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear chat history",
    });
  }
});

export default router;
