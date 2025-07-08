import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { StyleSheet, ViewStyle, TextStyle } from "react-native";

interface RTLStyles {
  [key: string]: ViewStyle | TextStyle;
}

export const useRTLStyles = (styles: RTLStyles) => {
  const { isRTL } = useLanguage();

  const rtlStyles: RTLStyles = {};

  Object.keys(styles).forEach((key) => {
    const style = styles[key];
    rtlStyles[key] = {
      ...style,
      ...(isRTL && {
        textAlign:
          style.textAlign === "left"
            ? "right"
            : style.textAlign === "right"
            ? "left"
            : style.textAlign,
        marginLeft: style.marginRight,
        marginRight: style.marginLeft,
        paddingLeft: style.paddingRight,
        paddingRight: style.paddingLeft,
        left: style.right,
        right: style.left,
        flexDirection:
          style.flexDirection === "row"
            ? "row-reverse"
            : style.flexDirection === "row-reverse"
            ? "row"
            : style.flexDirection,
      }),
    };
  });

  return rtlStyles;
};
