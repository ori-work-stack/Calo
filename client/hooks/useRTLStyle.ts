import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from "react-native";

interface RTLStyles {
  [key: string]: ViewStyle | TextStyle | ImageStyle;
}

export const useRTLStyles = (styles: RTLStyles) => {
  const { isRTL } = useLanguage();

  if (!isRTL) {
    return styles;
  }

  const rtlStyles: RTLStyles = {};

  Object.keys(styles).forEach((key) => {
    const style = styles[key] as any;
    rtlStyles[key] = {
      ...style,
      // Text alignment
      textAlign:
        style.textAlign === "left"
          ? "right"
          : style.textAlign === "right"
          ? "left"
          : style.textAlign,

      // Margin adjustments
      marginLeft: style.marginRight,
      marginRight: style.marginLeft,
      marginStart: style.marginEnd,
      marginEnd: style.marginStart,

      // Padding adjustments
      paddingLeft: style.paddingRight,
      paddingRight: style.paddingLeft,
      paddingStart: style.paddingEnd,
      paddingEnd: style.paddingStart,

      // Position adjustments
      left: style.right,
      right: style.left,
      start: style.end,
      end: style.start,

      // Flex direction
      flexDirection:
        style.flexDirection === "row"
          ? "row-reverse"
          : style.flexDirection === "row-reverse"
          ? "row"
          : style.flexDirection,

      // Border adjustments
      borderLeftWidth: style.borderRightWidth,
      borderRightWidth: style.borderLeftWidth,
      borderLeftColor: style.borderRightColor,
      borderRightColor: style.borderLeftColor,
      borderStartWidth: style.borderEndWidth,
      borderEndWidth: style.borderStartWidth,
      borderStartColor: style.borderEndColor,
      borderEndColor: style.borderStartColor,

      // Border radius adjustments
      borderTopLeftRadius: style.borderTopRightRadius,
      borderTopRightRadius: style.borderTopLeftRadius,
      borderBottomLeftRadius: style.borderBottomRightRadius,
      borderBottomRightRadius: style.borderBottomLeftRadius,
      borderTopStartRadius: style.borderTopEndRadius,
      borderTopEndRadius: style.borderTopStartRadius,
      borderBottomStartRadius: style.borderBottomEndRadius,
      borderBottomEndRadius: style.borderBottomStartRadius,

      // Transform adjustments for icons and images
      transform: style.transform
        ? [...style.transform, { scaleX: -1 }]
        : undefined,
    };
  });

  return rtlStyles;
};
