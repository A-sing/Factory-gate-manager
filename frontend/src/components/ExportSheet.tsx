import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FileSpreadsheet, FileText, X, Download as DownloadIcon } from "lucide-react-native";

import { Button } from "./Button";
import { useToast } from "./Toast";
import { downloadAndShare } from "@/src/lib/download";
import { rangeToQuery, type DateRange } from "./DateRangePicker";
import { colors } from "@/src/lib/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  endpoint: string;          // "/visitors/export" or "/attendance/export"
  fileBase: string;          // "visitors" or "labour_attendance"
  range: DateRange;
  extraQuery?: Record<string, string | undefined | null>;
};

export function ExportSheet({ visible, onClose, title, endpoint, fileBase, range, extraQuery }: Props) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [format, setFormat] = useState<"xlsx" | "pdf">("xlsx");
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    setBusy(true);
    try {
      const ts = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
      const filename = `${fileBase}_${ts}.${format}`;
      const mime =
        format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf";
      await downloadAndShare({
        path: endpoint,
        query: { format, ...rangeToQuery(range), ...(extraQuery || {}) },
        filename,
        mime,
      });
      toast.show("Report downloaded", "success");
      onClose();
    } catch (e: any) {
      toast.show(e?.message || "Download failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const rangeLabel =
    range.start || range.end
      ? `${range.start ? range.start.toLocaleDateString() : "Start"} → ${range.end ? range.end.toLocaleDateString() : "End"}`
      : "All time";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <DownloadIcon size={22} color={colors.secondary} strokeWidth={3} />
              <Text style={styles.title}>  {title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} testID="export-close-btn">
              <X size={24} color={colors.secondary} strokeWidth={3} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Format</Text>
          <View style={styles.row}>
            <TouchableOpacity
              testID="export-format-xlsx"
              onPress={() => setFormat("xlsx")}
              style={[styles.card, format === "xlsx" && styles.cardActive]}
            >
              <FileSpreadsheet
                size={32}
                color={format === "xlsx" ? colors.secondary : colors.success}
                strokeWidth={2.5}
              />
              <Text style={[styles.cardTitle, format === "xlsx" && styles.cardTitleActive]}>EXCEL</Text>
              <Text style={[styles.cardSub, format === "xlsx" && styles.cardSubActive]}>.xlsx</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="export-format-pdf"
              onPress={() => setFormat("pdf")}
              style={[styles.card, format === "pdf" && styles.cardActive]}
            >
              <FileText
                size={32}
                color={format === "pdf" ? colors.secondary : colors.danger}
                strokeWidth={2.5}
              />
              <Text style={[styles.cardTitle, format === "pdf" && styles.cardTitleActive]}>PDF</Text>
              <Text style={[styles.cardSub, format === "pdf" && styles.cardSubActive]}>.pdf</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rangeBox}>
            <Text style={styles.label}>Date Range</Text>
            <Text style={styles.rangeText}>{rangeLabel}</Text>
            <Text style={styles.hint}>Change the range in the filter above this sheet</Text>
          </View>

          <Button
            testID="export-download-btn"
            title={`Download ${format.toUpperCase()}`}
            onPress={handleDownload}
            loading={busy}
            size="lg"
            icon={<DownloadIcon size={20} color={colors.primaryFg} strokeWidth={3} />}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    padding: 20,
    borderTopWidth: 4,
    borderTopColor: colors.primary,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  title: { fontSize: 18, fontWeight: "900", letterSpacing: 0.5, color: colors.text },
  label: { fontSize: 12, fontWeight: "800", letterSpacing: 1, color: colors.text, textTransform: "uppercase", marginBottom: 8 },
  row: { flexDirection: "row", gap: 12, marginBottom: 16 },
  card: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  cardActive: { backgroundColor: colors.primary, borderColor: colors.secondary },
  cardTitle: { fontSize: 14, fontWeight: "900", letterSpacing: 1, marginTop: 8, color: colors.text },
  cardTitleActive: { color: colors.text },
  cardSub: { fontSize: 11, fontWeight: "600", color: colors.textMuted, marginTop: 2 },
  cardSubActive: { color: colors.text, opacity: 0.7 },
  rangeBox: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
    marginBottom: 18,
  },
  rangeText: { fontSize: 14, fontWeight: "800", color: colors.text },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
});
