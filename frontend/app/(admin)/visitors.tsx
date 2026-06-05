import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { ClipboardList } from "lucide-react-native";

import { TextField } from "@/src/components/TextField";
import { useToast } from "@/src/components/Toast";
import { api } from "@/src/lib/api";
import { colors } from "@/src/lib/theme";

type Visitor = {
  id: string;
  visitor_name: string;
  mobile_number?: string | null;
  purpose: string;
  photo_base64?: string | null;
  gate_name?: string | null;
  entry_datetime: string;
};

export default function VisitorReports() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [rows, setRows] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async (q?: string) => {
    try {
      const data = await api<Visitor[]>("/visitors", {
        query: { visitor_name: q || undefined, limit: 500 },
      });
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
        <ClipboardList size={20} color={colors.primary} strokeWidth={3} />
        <Text style={styles.headerTitle}>  Visitor Reports</Text>
      </View>

      <View style={{ padding: 14, paddingBottom: 0 }}>
        <TextField
          testID="visitor-search-input"
          placeholder="Search by name..."
          value={search}
          onChangeText={(t) => { setSearch(t); load(t); }}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.secondary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 14, paddingBottom: 32 }}
          ListEmptyComponent={<Text style={styles.empty}>No visitors found</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(search); }} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              {item.photo_base64 ? (
                <Image source={{ uri: item.photo_base64 }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, { backgroundColor: colors.border, alignItems: "center", justifyContent: "center" }]}>
                  <Text style={{ color: colors.textMuted, fontWeight: "800", fontSize: 12 }}>NO IMG</Text>
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name}>{item.visitor_name}</Text>
                <Text style={styles.purpose}>{item.purpose}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
                  {item.mobile_number ? <Text style={styles.meta}>📞 {item.mobile_number}  </Text> : null}
                  {item.gate_name ? <Text style={styles.meta}>🚪 {item.gate_name}  </Text> : null}
                </View>
                <Text style={styles.time}>{new Date(item.entry_datetime).toLocaleString()}</Text>
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
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
  },
  photo: { width: 64, height: 64, borderWidth: 2, borderColor: colors.secondary, borderRadius: 4 },
  name: { fontSize: 16, fontWeight: "800", color: colors.text },
  purpose: { fontSize: 13, color: colors.text, marginTop: 2, fontWeight: "600" },
  meta: { fontSize: 12, color: colors.textMuted },
  time: { fontSize: 11, color: colors.textMuted, marginTop: 4, fontWeight: "600" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 32, fontWeight: "600" },
});
