import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Activity, AlertCircle } from "lucide-react-native";

import { useToast } from "@/src/components/Toast";
import { api } from "@/src/lib/api";
import { colors } from "@/src/lib/theme";

type Row = {
  labour_id: string;
  labour_name: string;
  contractor_name?: string | null;
  category: string;
  check_in_time: string;
  gate_name?: string | null;
  photo_base64?: string | null;
};

export default function Occupancy() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api<Row[]>("/attendance/inside");
      setRows(data);
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Activity size={20} color={colors.primary} strokeWidth={3} />
        <Text style={styles.headerTitle}>  Emergency Roll Call</Text>
      </View>

      <View style={styles.banner}>
        <AlertCircle size={20} color={colors.warning} strokeWidth={3} />
        <Text style={styles.bannerText}>
          {"  "}{rows.length} {rows.length === 1 ? "person" : "people"} currently inside factory
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.secondary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => i.labour_id}
          contentContainerStyle={{ padding: 14, paddingBottom: 32 }}
          ListEmptyComponent={<Text style={styles.empty}>Factory is empty</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              {item.photo_base64 ? (
                <Image source={{ uri: item.photo_base64 }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, { backgroundColor: colors.border }]} />
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.id}>{item.labour_id}</Text>
                <Text style={styles.name}>{item.labour_name}</Text>
                <Text style={styles.meta}>{item.contractor_name || "—"} • {item.category}</Text>
                <Text style={styles.time}>Since {new Date(item.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 4, borderBottomColor: colors.primary,
    flexDirection: "row", alignItems: "center",
  },
  headerTitle: { color: colors.primary, fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  banner: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: colors.warningBg, borderBottomWidth: 2, borderBottomColor: colors.warning },
  bannerText: { fontWeight: "800", color: colors.text },
  row: { flexDirection: "row", backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 4, padding: 12, marginBottom: 10, alignItems: "center" },
  photo: { width: 60, height: 60, borderWidth: 2, borderColor: colors.secondary, borderRadius: 4 },
  id: { color: colors.primary, backgroundColor: colors.secondary, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, fontSize: 10, fontWeight: "900", letterSpacing: 1, borderRadius: 2 },
  name: { fontSize: 15, fontWeight: "800", color: colors.text, marginTop: 4 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  time: { fontSize: 11, color: colors.success, fontWeight: "700", marginTop: 2 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 32, fontWeight: "600" },
});
