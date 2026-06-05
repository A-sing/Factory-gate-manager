import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Users, Download } from "lucide-react-native";

import { DateRangePicker, rangeToQuery, type DateRange } from "@/src/components/DateRangePicker";
import { ExportSheet } from "@/src/components/ExportSheet";
import { TextField } from "@/src/components/TextField";
import { useToast } from "@/src/components/Toast";
import { api } from "@/src/lib/api";
import { colors, LABOUR_CATEGORIES } from "@/src/lib/theme";

type AttRow = {
  id?: string;
  labour_id: string;
  labour_name: string;
  contractor_name?: string | null;
  category: string;
  check_in_time: string;
  check_out_time?: string | null;
  total_hours?: number | null;
  status: string;
};

export default function LabourReports() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [rows, setRows] = useState<AttRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>({ start: null, end: null, label: "All Time" });
  const [exportOpen, setExportOpen] = useState(false);

  const load = useCallback(async (search: string, cat: string | null, r: DateRange) => {
    try {
      const data = await api<AttRow[]>("/attendance", {
        query: {
          labour_name: search || undefined,
          category: cat || undefined,
          ...rangeToQuery(r),
          limit: 500,
        },
      });
      setRows(data);
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(q, category, range); }, [load]));

  const onSearch = (t: string) => { setQ(t); load(t, category, range); };
  const onCategory = (c: string | null) => { setCategory(c); load(q, c, range); };
  const onRange = (r: DateRange) => { setRange(r); setLoading(true); load(q, category, r); };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Users size={20} color={colors.primary} strokeWidth={3} />
          <Text style={styles.headerTitle}>  Labour Reports</Text>
        </View>
        <TouchableOpacity
          testID="labour-export-btn"
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
          testID="labour-report-search"
          placeholder="Search by name..."
          value={q}
          onChangeText={onSearch}
        />
        <View style={{ height: 56 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <TouchableOpacity
              onPress={() => onCategory(null)}
              style={[styles.chip, !category && styles.chipActive]}
            >
              <Text style={[styles.chipText, !category && styles.chipTextActive]}>All</Text>
            </TouchableOpacity>
            {LABOUR_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => onCategory(c)}
                style={[styles.chip, category === c && styles.chipActive]}
              >
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.secondary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i, idx) => `${i.labour_id}-${i.check_in_time}-${idx}`}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 32 }}
          ListHeaderComponent={
            <Text style={styles.count}>{rows.length} record{rows.length === 1 ? "" : "s"}</Text>
          }
          ListEmptyComponent={<Text style={styles.empty}>No records in selected range</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(q, category, range); }} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.idCol}>
                <Text style={styles.id}>{item.labour_id}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.labour_name}</Text>
                <Text style={styles.meta}>{item.contractor_name || "—"} • {item.category}</Text>
                <Text style={styles.time}>IN: {new Date(item.check_in_time).toLocaleString()}</Text>
                {item.check_out_time ? (
                  <Text style={styles.timeOut}>
                    OUT: {new Date(item.check_out_time).toLocaleString()}  •  {item.total_hours}h
                  </Text>
                ) : (
                  <View style={[styles.statusChip, { backgroundColor: colors.successBg, borderColor: colors.success }]}>
                    <Text style={[styles.statusText, { color: colors.success }]}>INSIDE</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        />
      )}

      <ExportSheet
        visible={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Labour Report"
        endpoint="/attendance/export"
        fileBase="labour_attendance"
        range={range}
        extraQuery={{ category: category || undefined }}
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
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  dlBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 4, borderWidth: 2, borderColor: colors.primary,
  },
  dlBtnText: { color: colors.text, fontWeight: "900", fontSize: 11, letterSpacing: 1 },
  count: { fontSize: 11, fontWeight: "800", letterSpacing: 1, color: colors.textMuted, marginBottom: 8, textTransform: "uppercase" },
  chipRow: { gap: 8, paddingVertical: 8 },
  chip: { paddingHorizontal: 14, height: 36, borderWidth: 2, borderColor: colors.border, borderRadius: 4, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, flexShrink: 0 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.secondary },
  chipText: { fontSize: 12, fontWeight: "700", color: colors.text },
  chipTextActive: { color: colors.secondary },
  row: { flexDirection: "row", backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 4, padding: 12, marginBottom: 10 },
  idCol: { marginRight: 12 },
  id: { color: colors.primary, backgroundColor: colors.secondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  name: { fontSize: 15, fontWeight: "800", color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  time: { fontSize: 11, color: colors.text, fontWeight: "600", marginTop: 4 },
  timeOut: { fontSize: 11, color: colors.danger, fontWeight: "700", marginTop: 2 },
  statusChip: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 32, fontWeight: "600" },
});
