import { Tabs } from "expo-router";
import { LayoutDashboard, ClipboardList, Users, Building2, Activity } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/src/lib/theme";

export default function AdminTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#A1A1AA",
        tabBarStyle: {
          backgroundColor: colors.secondary,
          borderTopColor: colors.primary,
          borderTopWidth: 3,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="visitors"
        options={{
          title: "Visitors",
          tabBarIcon: ({ color }) => <ClipboardList size={22} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="labour"
        options={{
          title: "Labour",
          tabBarIcon: ({ color }) => <Users size={22} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="contractors"
        options={{
          title: "Contractors",
          tabBarIcon: ({ color }) => <Building2 size={22} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="occupancy"
        options={{
          title: "Roll Call",
          tabBarIcon: ({ color }) => <Activity size={22} color={color} strokeWidth={2.5} />,
        }}
      />
    </Tabs>
  );
}
