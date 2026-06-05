import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LogOut, UserPlus, Users, Shield } from "lucide-react-native";

import { useAuth } from "@/src/lib/auth";
import { colors } from "@/src/lib/theme";

export default function GuardHome() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View style={styles.brand}>
            <Shield size={26} color={colors.primary} strokeWidth={3} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.brandTitle}>DBS FACTORY</Text>
              <Text style={styles.brandSubtitle}>Gate Operations</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} testID="guard-logout-btn" style={styles.logoutBtn}>
            <LogOut size={20} color="#fff" strokeWidth={3} />
          </TouchableOpacity>
        </View>
        <View style={styles.guardInfo}>
          <Text style={styles.guardName}>{user?.name?.toUpperCase()}</Text>
          <Text style={styles.dateTime}>{date} • {time}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.prompt}>SELECT ENTRY TYPE</Text>

        <TouchableOpacity
          testID="guard-visitor-entry-btn"
          activeOpacity={0.85}
          onPress={() => router.push("/(guard)/visitor")}
          style={[styles.bigBtn, { backgroundColor: colors.secondary, borderColor: colors.secondary }]}
        >
          <UserPlus size={56} color={colors.primary} strokeWidth={2.5} />
          <Text style={[styles.bigBtnLabel, { color: "#fff" }]}>VISITOR{"\n"}ENTRY</Text>
          <Text style={[styles.bigBtnSub, { color: colors.primary }]}>One-time visit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="guard-labour-entry-btn"
          activeOpacity={0.85}
          onPress={() => router.push("/(guard)/labour")}
          style={[styles.bigBtn, { backgroundColor: colors.primary, borderColor: colors.secondary }]}
        >
          <Users size={56} color={colors.secondary} strokeWidth={2.5} />
          <Text style={[styles.bigBtnLabel, { color: colors.secondary }]}>LABOUR{"\n"}ENTRY</Text>
          <Text style={[styles.bigBtnSub, { color: colors.secondary }]}>Check-in / Check-out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomWidth: 4,
    borderBottomColor: colors.primary,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center" },
  brandTitle: { color: colors.primary, fontWeight: "900", fontSize: 18, letterSpacing: 1 },
  brandSubtitle: { color: "#A1A1AA", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  logoutBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  guardInfo: { marginTop: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  guardName: { color: "#fff", fontWeight: "800", letterSpacing: 1, fontSize: 12 },
  dateTime: { color: colors.primary, fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  body: { flex: 1, padding: 20, justifyContent: "center" },
  prompt: {
    color: colors.textMuted,
    fontWeight: "800",
    letterSpacing: 2,
    fontSize: 12,
    marginBottom: 16,
    textAlign: "center",
  },
  bigBtn: {
    flex: 1,
    marginVertical: 10,
    borderRadius: 4,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  bigBtnLabel: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 14,
  },
  bigBtnSub: { fontSize: 13, fontWeight: "700", letterSpacing: 1, marginTop: 8, textTransform: "uppercase" },
});
