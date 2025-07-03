import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpeg" | "png" | "webp";
}

export async function optimizeImageForUpload(
  imageUri: string,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
    format = "jpeg",
  } = options;

  try {
    console.log("🖼️ Optimizing image...");
    console.log("📏 Max dimensions:", maxWidth, "x", maxHeight);
    console.log("🎯 Quality:", quality);

    // Get image info first
    const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
      format: ImageManipulator.SaveFormat.JPEG,
    });

    console.log("📊 Original image info:", imageInfo);

    // Calculate resize dimensions while maintaining aspect ratio
    const { width: originalWidth, height: originalHeight } = imageInfo;
    let { width: targetWidth, height: targetHeight } = imageInfo;

    if (originalWidth > maxWidth || originalHeight > maxHeight) {
      const aspectRatio = originalWidth / originalHeight;

      if (originalWidth > originalHeight) {
        targetWidth = Math.min(maxWidth, originalWidth);
        targetHeight = targetWidth / aspectRatio;
      } else {
        targetHeight = Math.min(maxHeight, originalHeight);
        targetWidth = targetHeight * aspectRatio;
      }
    }

    // Apply optimizations
    const manipulatorFormat =
      format === "jpeg"
        ? ImageManipulator.SaveFormat.JPEG
        : format === "png"
        ? ImageManipulator.SaveFormat.PNG
        : ImageManipulator.SaveFormat.WEBP;

    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: Math.round(targetWidth),
            height: Math.round(targetHeight),
          },
        },
      ],
      {
        compress: quality,
        format: manipulatorFormat,
        base64: true,
      }
    );

    console.log("✅ Image optimized successfully");
    console.log(
      "📏 New dimensions:",
      manipulatedImage.width,
      "x",
      manipulatedImage.height
    );
    console.log(
      "📦 Base64 size:",
      manipulatedImage.base64?.length || 0,
      "characters"
    );

    return manipulatedImage.base64 || "";
  } catch (error) {
    console.error("💥 Image optimization failed:", error);
    throw new Error("Failed to optimize image");
  }
}

export function getOptimalImageSettings(
  purpose: "analysis" | "thumbnail" | "display"
): ImageOptimizationOptions {
  switch (purpose) {
    case "analysis":
      return {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.85,
        format: "jpeg",
      };
    case "thumbnail":
      return {
        maxWidth: 300,
        maxHeight: 300,
        quality: 0.7,
        format: "jpeg",
      };
    case "display":
      return {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
        format: "jpeg",
      };
    default:
      return {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        format: "jpeg",
      };
  }
}

export function estimateBase64Size(
  width: number,
  height: number,
  quality: number = 0.8
): number {
  // Rough estimation of base64 size in bytes
  const pixelCount = width * height;
  const bytesPerPixel = quality * 3; // RGB with compression
  const estimatedBytes = pixelCount * bytesPerPixel;
  const base64Overhead = 1.37; // Base64 encoding overhead

  return Math.round(estimatedBytes * base64Overhead);
}

export function shouldCompressImage(
  imageUri: string,
  maxSizeBytes: number = 1024 * 1024
): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === "web") {
      // For web, we can't easily get file size without loading it
      resolve(true);
      return;
    }

    // For mobile, always compress for consistency
    resolve(true);
  });
}
