import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { QrCode, Search, UserPlus, LogOut as ExitIcon } from "lucide-react-native";

import { Header } from "@/src/components/Header";
import { colors } from "@/src/lib/theme";

export default function LabourHub() {
  const router = useRouter();

  const actions: { title: string; subtitle: string; icon: any; color: string; testID: string; to: any }[] = [
    {
      title: "SEARCH LABOUR",
      subtitle: "By ID, Name or Aadhaar",
      icon: <Search size={36} color="#fff" strokeWidth={2.5} />,
      color: colors.text,
      testID: "labour-search-btn",
      to: "/(guard)/labour/search",
    },
    {
      title: "SCAN QR",
      subtitle: "Fast camera scan",
      icon: <QrCode size={36} color={colors.text} strokeWidth={2.5} />,
      color: colors.primary,
      testID: "labour-scan-btn",
      to: "/(guard)/labour/scan",
    },
    {
      title: "NEW REGISTRATION",
      subtitle: "First-time labour",
      icon: <UserPlus size={36} color="#fff" strokeWidth={2.5} />,
      color: colors.info,
      testID: "labour-new-btn",
      to: "/(guard)/labour/new",
    },
    {
      title: "CURRENTLY INSIDE",
      subtitle: "Live roll call",
      icon: <ExitIcon size={36} color="#fff" strokeWidth={2.5} />,
      color: colors.success,
      testID: "labour-inside-btn",
      to: "/(guard)/labour/inside",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Labour Entry" subtitle="Check-in / Check-out" back />
      <View style={styles.grid}>
        {actions.map((a) => (
          <TouchableOpacity
            key={a.title}
            testID={a.testID}
            activeOpacity={0.85}
            onPress={() => router.push(a.to)}
            style={[styles.card, { backgroundColor: a.color }]}
          >
            {a.icon}
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {a.title}
            </Text>
            <Text style={[styles.cardSub, { color: colors.text }]}>
              {a.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flex: 1, padding: 12, flexDirection: "row", flexWrap: "wrap" },
  card: {
    width: "50%",
    aspectRatio: 1,
    padding: 16,
    borderWidth: 3,
    borderColor: colors.secondary,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 12,
  },
  cardSub: { fontSize: 11, fontWeight: "600", textAlign: "center", marginTop: 4, opacity: 0.9 },
});
