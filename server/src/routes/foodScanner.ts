import express from "express";
import { authenticateToken } from "../middleware/auth";
import { FoodScannerService } from "../services/foodScanner";
import { prisma } from "../lib/database";

const router = express.Router();

router.use(authenticateToken);

// Scan barcode
router.post("/barcode", async (req, res) => {
  try {
    const { barcode } = req.body;
    const userId = req.user?.user_id;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        error: "Barcode is required",
      });
    }
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated or user ID missing.",
      });
    }

    const result = await FoodScannerService.scanBarcode(barcode, userId);

    const existing = await prisma.foodProduct.findUnique({
      where: { barcode: result.product.barcode },
    });

    if (!existing) {
      // Save scanned product to database
      await prisma.foodProduct.create({
        data: {
          health_score: Number(result.user_analysis.health_assessment),
          image_url: result.product.image_url,
          user_id: userId,
          barcode: result.product.barcode || "",
          product_name: result.product.name,
          brand: result.product.brand || "",
          ingredients: result.product.ingredients,
          category: result.product.category || "Uncategorized",
          nutrition_per_100g: result.product.nutrition_per_100g || {},
          allergens: result.product.allergens || [],
          labels: result.product.labels || [],
          created_at: new Date(),
        },
      });
    } else {
      console.log("ℹ️ Product already exists, skipping insert");
    }

    res.json({
      success: true,
      product: result,
    });
  } catch (error) {
    console.error("Barcode scan API error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to scan barcode",
    });
  }
});

// Scan product image/label
router.post("/image", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const userId = req.user?.user_id;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: "Image is required",
      });
    }
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated or user ID missing.",
      });
    }

    const result = await FoodScannerService.scanProductImage(
      imageBase64,
      userId
    );

    // Save scanned product to database
    await prisma.foodProduct.create({
      data: {
        health_score: Number(result.user_analysis.health_assessment),
        image_url: result.product.image_url,
        user_id: userId,
        barcode: result.product.barcode || "",
        product_name: result.product.name,
        brand: result.product.brand || "",
        ingredients: result.product.ingredients,
        category: result.product.category || "Uncategorized",
        nutrition_per_100g: result.product.nutrition_per_100g || {},
        allergens: result.product.allergens || [],
        labels: result.product.labels || [],
        created_at: new Date(),
      },
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Image scan API error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to scan product image",
    });
  }
});

// Get scanned products history
router.get("/history", async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated or user ID missing.",
      });
    }

    const scannedProducts = await prisma.foodProduct.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 50, // Limit to last 50 scanned products
    });

    res.json({
      success: true,
      data: scannedProducts,
    });
  } catch (error) {
    console.error("Get history API error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get scanned products history",
    });
  }
});

// Add scanned product to meal log
router.post("/add-to-meal", async (req, res) => {
  try {
    const { productData, quantity, mealTiming } = req.body;
    const userId = req.user?.user_id;

    if (!productData || !quantity) {
      return res.status(400).json({
        success: false,
        error: "Product data and quantity are required",
      });
    }
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated or user ID missing.",
      });
    }
    const result = await FoodScannerService.addProductToMealLog(
      userId,
      productData,
      quantity,
      mealTiming
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Add to meal API error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add product to meal log",
    });
  }
});

export default router;
