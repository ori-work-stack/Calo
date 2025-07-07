import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import { ComponentProps } from "react";
import { OpaqueColorValue, StyleProp, TextStyle } from "react-native";

// Add all the symbols you are actually using in TabLayout
type SupportedSymbolName =
  | "house.fill"
  | "fork.knife"
  | "camera.fill"
  | "chart.bar.fill"
  | "calendar"
  | "watch.digital"
  | "clock.fill"
  | "person.fill"
  | "dining"
  | "message.fill"
  | "barcode.viewfinder";

type IconLibrary =
  | "MaterialIcons"
  | "Ionicons"
  | "MaterialCommunityIcons"
  | "Feather";

type IconMapping = Record<
  SupportedSymbolName,
  {
    library: IconLibrary;
    name: string;
  }
>;

const MAPPING: IconMapping = {
  "house.fill": {
    library: "Ionicons",
    name: "home", // Ionicons has the best home icon
  },
  "fork.knife": {
    library: "MaterialCommunityIcons",
    name: "silverware-fork-knife", // Perfect fork and knife icon
  },
  "camera.fill": {
    library: "Ionicons",
    name: "camera", // Ionicons camera is superior
  },
  "chart.bar.fill": {
    library: "MaterialCommunityIcons",
    name: "chart-bar", // Better bar chart representation
  },
  calendar: {
    library: "Ionicons",
    name: "calendar", // Clean, modern calendar
  },
  "watch.digital": {
    library: "MaterialCommunityIcons",
    name: "watch-variant", // Best digital watch icon
  },
  "clock.fill": {
    library: "Ionicons",
    name: "time", // Beautiful filled clock
  },
  dining: {
    library: "MaterialCommunityIcons",
    name: "food-fork-drink", // Perfect dining icon with utensils and drink
  },
  "person.fill": {
    library: "Ionicons",
    name: "person", // Ionicons person is cleaner
  },
  "message.fill": {
    library: "Ionicons",
    name: "chatbubble", // Superior message bubble
  },
  "barcode.viewfinder": {
    library: "MaterialCommunityIcons",
    name: "barcode-scan", // Perfect barcode scanner icon
  },
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
  const iconConfig = MAPPING[name];

  if (!iconConfig) {
    console.warn(`Icon "${name}" is not mapped to any icon library.`);
    // Return a fallback icon
    return (
      <MaterialIcons
        name="help-outline"
        size={size}
        color={color}
        style={style}
      />
    );
  }

  const { library, name: iconName } = iconConfig;

  // Render the appropriate icon based on the library
  switch (library) {
    case "MaterialIcons":
      return (
        <MaterialIcons
          name={iconName as ComponentProps<typeof MaterialIcons>["name"]}
          size={size}
          color={color}
          style={style}
        />
      );
    case "Ionicons":
      return (
        <Ionicons
          name={iconName as ComponentProps<typeof Ionicons>["name"]}
          size={size}
          color={color}
          style={style}
        />
      );
    case "MaterialCommunityIcons":
      return (
        <MaterialCommunityIcons
          name={
            iconName as ComponentProps<typeof MaterialCommunityIcons>["name"]
          }
          size={size}
          color={color}
          style={style}
        />
      );
    case "Feather":
      return (
        <Feather
          name={iconName as ComponentProps<typeof Feather>["name"]}
          size={size}
          color={color}
          style={style}
        />
      );
    default:
      console.warn(`Unknown icon library: ${library}`);
      return (
        <MaterialIcons
          name="help-outline"
          size={size}
          color={color}
          style={style}
        />
      );
  }
}
