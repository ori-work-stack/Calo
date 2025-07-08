import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { useLanguage } from "@/src/i18n/context/LanguageContext";

interface LocalizedTextProps extends TextProps {
  children: React.ReactNode;
  rtlStyle?: any;
}

export const LocalizedText: React.FC<LocalizedTextProps> = ({
  children,
  style,
  rtlStyle,
  ...props
}) => {
  const { isRTL } = useLanguage();

  const textStyle = [style, isRTL && styles.rtlText, isRTL && rtlStyle];

  return (
    <Text style={textStyle} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
});

export default LocalizedText;
