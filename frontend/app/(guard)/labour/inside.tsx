import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { Header } from "@/src/components/Header";
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

export default function InsideList() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api<Row[]>("/attendance/inside");
      setRows(data);
    } catch (e: any) {
      toast.show(e?.message || "Failed to load", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Currently Inside" subtitle={`${rows.length} person${rows.length === 1 ? "" : "s"}`} back />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.secondary} /></View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => i.labour_id}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          ListEmptyComponent={<Text style={styles.empty}>No labour currently inside</Text>}
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
                <Text style={styles.time}>
                  IN: {new Date(item.check_in_time).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  photo: { width: 64, height: 64, borderWidth: 2, borderColor: colors.secondary, borderRadius: 4 },
  id: { color: colors.text, backgroundColor: colors.primary, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, fontSize: 11, fontWeight: "900", letterSpacing: 1, borderRadius: 2 },
  name: { fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 4 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  time: { fontSize: 11, color: colors.success, fontWeight: "700", marginTop: 4 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 32, fontWeight: "600" },
});
