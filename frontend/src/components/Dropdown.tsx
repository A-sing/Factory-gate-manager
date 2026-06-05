import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ChevronDown, Check, X } from "lucide-react-native";
import { colors } from "@/src/lib/theme";

type Props = {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  testID?: string;
};

export function Dropdown({ label, value, options, onChange, placeholder = "Select...", testID }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        testID={testID}
        style={styles.input}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.value, !value && { color: colors.textMuted }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <ChevronDown size={20} color={colors.text} strokeWidth={3} />
      </TouchableOpacity>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <X size={22} color={colors.text} strokeWidth={3} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              {options.length === 0 ? (
                <Text style={styles.empty}>No options. Ask admin to add.</Text>
              ) : (
                options.map((opt) => {
                  const selected = opt === value;
                  return (
                    <TouchableOpacity
                      key={opt}
                      testID={`${testID}-opt-${opt}`}
                      style={[styles.row, selected && styles.rowSelected]}
                      onPress={() => {
                        onChange(opt);
                        setOpen(false);
                      }}
                    >
                      <Text style={[styles.rowText, selected && styles.rowTextSelected]}>{opt}</Text>
                      {selected ? <Check size={18} color={colors.text} strokeWidth={3} /> : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.text,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  value: { fontSize: 16, color: colors.text, fontWeight: "600", flex: 1, marginRight: 8 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 },
  sheet: { backgroundColor: colors.surface, borderRadius: 6, borderWidth: 2, borderColor: colors.secondary, padding: 16 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sheetTitle: { fontSize: 16, fontWeight: "900", color: colors.text, letterSpacing: 1, textTransform: "uppercase" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 4,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  rowSelected: { borderColor: colors.secondary, backgroundColor: colors.successBg },
  rowText: { fontSize: 15, fontWeight: "600", color: colors.text },
  rowTextSelected: { fontWeight: "800" },
  empty: { textAlign: "center", color: colors.textMuted, paddingVertical: 24, fontWeight: "600" },
});
