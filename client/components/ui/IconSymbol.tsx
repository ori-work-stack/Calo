import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ComponentProps } from "react";
import { OpaqueColorValue, StyleProp, TextStyle } from "react-native";

// ✅ Add only the symbols you are actually using in TabLayout
type SupportedSymbolName =
  | "house.fill"
  | "fork.knife"
  | "camera.fill"
  | "chart.bar.fill"
  | "calendar"
  | "watch.digital"
  | "clock.fill"
  | "person.fill";

type IconMapping = Record<
  SupportedSymbolName,
  ComponentProps<typeof MaterialIcons>["name"]
>;

const MAPPING: IconMapping = {
  "house.fill": "home",
  "fork.knife": "restaurant", // closest MaterialIcon match
  "camera.fill": "photo-camera",
  "chart.bar.fill": "bar-chart",
  calendar: "calendar-today",
  "watch.digital": "watch", // use a generic watch icon
  "clock.fill": "access-time", // or "schedule"
  "person.fill": "person",
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: SupportedSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  const mappedName = MAPPING[name];

  if (!mappedName) {
    console.warn(`Icon "${name}" is not mapped to a MaterialIcon.`);
    return null;
  }

  return (
    <MaterialIcons name={mappedName} size={size} color={color} style={style} />
  );
}
