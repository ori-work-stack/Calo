import { LucideIcon } from "lucide-react-native";
import {
  Home,
  Utensils,
  Camera,
  BarChart3,
  Calendar,
  Watch,
  Clock,
  User,
  ChefHat,
  MessageCircle,
  Scan,
  FileText,
} from "lucide-react-native";
import { StyleProp, TextStyle } from "react-native";

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
  | "barcode.viewfinder"
  | "doc.text.fill";

type IconMapping = Record<SupportedSymbolName, LucideIcon>;

const MAPPING: IconMapping = {
  "house.fill": Home,
  "fork.knife": Utensils,
  "camera.fill": Camera,
  "chart.bar.fill": BarChart3,
  calendar: Calendar,
  "watch.digital": Watch,
  "clock.fill": Clock,
  "person.fill": User,
  dining: ChefHat,
  "message.fill": MessageCircle,
  "barcode.viewfinder": Scan,
  "doc.text.fill": FileText,
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: SupportedSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<TextStyle>;
}) {
  const IconComponent = MAPPING[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" is not mapped to any Lucide icon.`);
    // Return a fallback icon
    return <FileText size={size} color={color} style={style} />;
  }

  return <IconComponent size={size} color={color} style={style} />;
}
