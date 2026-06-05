import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Building2,
  ClipboardList,
  LogIn,
  LogOut,
  Shield,
  Users,
} from "lucide-react-native";

import { useToast } from "@/src/components/Toast";
import { useAuth } from "@/src/lib/auth";
import { useSettings } from "@/src/lib/settings";
import { api } from "@/src/lib/api";
import { colors } from "@/src/lib/theme";

type Stats = {
  visitors_today: number;
  labour_inside: number;
  checked_out_today: number;
  total_labour: number;
  contractor_count: number;
  contractors: { id: string; contractor_name: string; labour_count: number; attendance_today: number }[];
};

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const toast = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await api<Stats>("/dashboard/stats");
      setStats(s);
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (loading && !stats) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.secondary} />
      </View>
    );
  }

  const cards = [
    { label: "Visitors Today", value: stats?.visitors_today ?? 0, icon: <ClipboardList size={22} color={colors.primary} strokeWidth={3} />, bg: colors.secondary, fg: "#fff" },
    { label: "Labour Inside", value: stats?.labour_inside ?? 0, icon: <LogIn size={22} color={colors.secondary} strokeWidth={3} />, bg: colors.primary, fg: colors.secondary },
    { label: "Checked Out Today", value: stats?.checked_out_today ?? 0, icon: <LogOut size={22} color="#fff" strokeWidth={3} />, bg: colors.info, fg: "#fff" },
    { label: "Total Labour", value: stats?.total_labour ?? 0, icon: <Users size={22} color={colors.secondary} strokeWidth={3} />, bg: colors.successBg, fg: colors.secondary },
    { label: "Contractors", value: stats?.contractor_count ?? 0, icon: <Building2 size={22} color="#fff" strokeWidth={3} />, bg: colors.warning, fg: "#fff" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Shield size={22} color={colors.primary} strokeWidth={3} />
          <Text style={styles.headerTitle}>  {(settings.business_name || "DBS Factory").toUpperCase()} • ADMIN</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} testID="admin-logout-btn" style={styles.logoutBtn}>
          <LogOut size={18} color="#fff" strokeWidth={3} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Text style={styles.greeting}>Welcome, {user?.name}</Text>
        <Text style={styles.subtitle}>Live factory overview</Text>

        <View style={styles.grid}>
          {cards.map((c, i) => (
            <View
              key={c.label}
              testID={`stat-card-${i}`}
              style={[styles.statCard, { backgroundColor: c.bg, width: i === 0 ? "100%" : "48.5%" }]}
            >
              <View style={styles.statTop}>
                <Text style={[styles.statLabel, { color: c.fg }]}>{c.label}</Text>
                {c.icon}
              </View>
              <Text style={[styles.statValue, { color: c.fg }]}>{c.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>By Contractor</Text>
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2 }]}>Contractor</Text>
            <Text style={styles.th}>Labour</Text>
            <Text style={styles.th}>Today</Text>
          </View>
          {(stats?.contractors || []).length === 0 ? (
            <Text style={styles.empty}>No contractors registered</Text>
          ) : (
            stats!.contractors.map((c) => (
              <View key={c.id} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 2 }]} numberOfLines={1}>{c.contractor_name}</Text>
                <Text style={styles.td}>{c.labour_count}</Text>
                <Text style={[styles.td, { color: colors.success, fontWeight: "800" }]}>{c.attendance_today}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 4,
    borderBottomColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  logoutBtn: {
    width: 38, height: 38, backgroundColor: colors.danger, borderRadius: 4, borderWidth: 2, borderColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  greeting: { fontSize: 22, fontWeight: "900", color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: 2, marginBottom: 18, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    padding: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  statTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", opacity: 0.85 },
  statValue: { fontSize: 36, fontWeight: "900", marginTop: 6 },
  sectionTitle: { marginTop: 24, marginBottom: 10, fontSize: 14, fontWeight: "900", letterSpacing: 1, color: colors.text, textTransform: "uppercase" },
  tableCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: { flexDirection: "row", backgroundColor: colors.secondary, padding: 12 },
  th: { flex: 1, color: colors.text, fontWeight: "900", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  tableRow: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  td: { flex: 1, color: colors.text, fontWeight: "600", fontSize: 13 },
  empty: { padding: 16, textAlign: "center", color: colors.textMuted, fontWeight: "600" },
});
