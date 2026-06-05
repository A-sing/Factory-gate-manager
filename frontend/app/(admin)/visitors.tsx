import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { ClipboardList, Download } from "lucide-react-native";

import { DateRangePicker, rangeToQuery, type DateRange } from "@/src/components/DateRangePicker";
import { ExportSheet } from "@/src/components/ExportSheet";
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
  const [range, setRange] = useState<DateRange>({ start: null, end: null, label: "All Time" });
  const [exportOpen, setExportOpen] = useState(false);

  const load = useCallback(async (q: string, r: DateRange) => {
    try {
      const data = await api<Visitor[]>("/visitors", {
        query: { visitor_name: q || undefined, ...rangeToQuery(r), limit: 500 },
      });
      setRows(data);
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(search, range); }, [load]));

  const onRange = (r: DateRange) => { setRange(r); setLoading(true); load(search, r); };
  const onSearch = (t: string) => { setSearch(t); load(t, range); };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <ClipboardList size={20} color={colors.primary} strokeWidth={3} />
          <Text style={styles.headerTitle}>  Visitor Reports</Text>
        </View>
        <TouchableOpacity
          testID="visitor-export-btn"
          onPress={() => setExportOpen(true)}
          style={styles.dlBtn}
        >
          <Download size={16} color={colors.secondary} strokeWidth={3} />
          <Text style={styles.dlBtnText}>  EXPORT</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding: 14 }}>
        <DateRangePicker value={range} onChange={onRange} />
        <View style={{ height: 12 }} />
        <TextField
          testID="visitor-search-input"
          placeholder="Search by name..."
          value={search}
          onChangeText={onSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.secondary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 32 }}
          ListHeaderComponent={
            <Text style={styles.count}>{rows.length} record{rows.length === 1 ? "" : "s"}</Text>
          }
          ListEmptyComponent={<Text style={styles.empty}>No visitors in selected range</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(search, range); }} />}
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

      <ExportSheet
        visible={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Visitor Report"
        endpoint="/visitors/export"
        fileBase="visitors"
        range={range}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 4, borderBottomColor: colors.primary,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  headerTitle: { color: colors.primary, fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  dlBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 2, borderColor: colors.primary,
  },
  dlBtnText: { color: colors.secondary, fontWeight: "900", fontSize: 11, letterSpacing: 1 },
  count: { fontSize: 11, fontWeight: "800", letterSpacing: 1, color: colors.textMuted, marginBottom: 8, textTransform: "uppercase" },
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
