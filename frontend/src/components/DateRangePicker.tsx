import { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Calendar, X } from "lucide-react-native";
import { colors } from "@/src/lib/theme";

export type DateRange = { start: Date | null; end: Date | null; label: string };

type Preset = { key: string; label: string; range: () => DateRange };

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

const PRESETS: Preset[] = [
  { key: "all",    label: "All Time",     range: () => ({ start: null, end: null, label: "All Time" }) },
  { key: "today",  label: "Today",        range: () => { const n = new Date(); return { start: startOfDay(n), end: endOfDay(n), label: "Today" }; } },
  { key: "yest",   label: "Yesterday",    range: () => { const y = new Date(); y.setDate(y.getDate() - 1); return { start: startOfDay(y), end: endOfDay(y), label: "Yesterday" }; } },
  { key: "7d",     label: "Last 7 days",  range: () => { const n = new Date(); const s = new Date(); s.setDate(s.getDate() - 6); return { start: startOfDay(s), end: endOfDay(n), label: "Last 7 days" }; } },
  { key: "30d",    label: "Last 30 days", range: () => { const n = new Date(); const s = new Date(); s.setDate(s.getDate() - 29); return { start: startOfDay(s), end: endOfDay(n), label: "Last 30 days" }; } },
  { key: "month",  label: "This Month",   range: () => { const n = new Date(); const s = new Date(n.getFullYear(), n.getMonth(), 1); return { start: startOfDay(s), end: endOfDay(n), label: "This Month" }; } },
];

const fmt = (d: Date | null) => (d ? d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" }) : "—");

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
}) {
  const [activePreset, setActivePreset] = useState<string>("all");
  const [picking, setPicking] = useState<"start" | "end" | null>(null);

  const applyPreset = (p: Preset) => {
    setActivePreset(p.key);
    onChange(p.range());
  };

  const onDate = (event: DateTimePickerEvent, date?: Date) => {
    const which = picking;
    if (Platform.OS !== "ios") setPicking(null);
    if (event.type === "dismissed" || !date) {
      if (Platform.OS === "ios") setPicking(null);
      return;
    }
    setActivePreset("custom");
    if (which === "start") {
      onChange({ start: startOfDay(date), end: value.end, label: "Custom" });
    } else {
      onChange({ start: value.start, end: endOfDay(date), label: "Custom" });
    }
    if (Platform.OS === "ios") setPicking(null);
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Calendar size={14} color={colors.secondary} strokeWidth={3} />
          <Text style={styles.headerText}>  Date Range</Text>
        </View>
        {(value.start || value.end) ? (
          <TouchableOpacity testID="daterange-clear" onPress={() => { setActivePreset("all"); onChange({ start: null, end: null, label: "All Time" }); }}>
            <X size={16} color={colors.danger} strokeWidth={3} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p.key}
            testID={`preset-${p.key}`}
            onPress={() => applyPreset(p)}
            style={[styles.chip, activePreset === p.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, activePreset === p.key && styles.chipTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.customRow}>
        <TouchableOpacity testID="daterange-start" style={styles.customCell} onPress={() => setPicking("start")}>
          <Text style={styles.cellLabel}>From</Text>
          <Text style={styles.cellValue}>{fmt(value.start)}</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity testID="daterange-end" style={styles.customCell} onPress={() => setPicking("end")}>
          <Text style={styles.cellLabel}>To</Text>
          <Text style={styles.cellValue}>{fmt(value.end)}</Text>
        </TouchableOpacity>
      </View>

      {picking ? (
        <DateTimePicker
          value={(picking === "start" ? value.start : value.end) || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDate}
          maximumDate={new Date()}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  headerText: { fontWeight: "800", fontSize: 12, letterSpacing: 1, color: colors.text, textTransform: "uppercase" },
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.secondary },
  chipText: { fontSize: 12, fontWeight: "700", color: colors.text },
  chipTextActive: { color: colors.text },
  customRow: {
    flexDirection: "row",
    marginTop: 10,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  customCell: { flex: 1, padding: 10 },
  cellLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1, color: colors.textMuted, textTransform: "uppercase" },
  cellValue: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 2 },
  divider: { width: 2, backgroundColor: colors.secondary },
});

export function rangeToQuery(r: DateRange): { start?: string; end?: string } {
  const q: { start?: string; end?: string } = {};
  if (r.start) q.start = r.start.toISOString();
  if (r.end) q.end = r.end.toISOString();
  return q;
}
