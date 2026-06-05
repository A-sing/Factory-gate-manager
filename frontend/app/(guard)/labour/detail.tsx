import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { LogIn, LogOut as LogOutIcon, IdCard } from "lucide-react-native";

import { Button } from "@/src/components/Button";
import { Header } from "@/src/components/Header";
import { useToast } from "@/src/components/Toast";
import { api, ApiError } from "@/src/lib/api";
import { colors } from "@/src/lib/theme";

type Labour = {
  id: string;
  labour_id: string;
  labour_name: string;
  contractor_name?: string | null;
  category: string;
  photo_base64: string;
  aadhaar_number?: string | null;
  mobile_number?: string | null;
};

type Attendance = { status: "inside" | "checked_out" } | null;

export default function LabourDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [labour, setLabour] = useState<Labour | null>(null);
  const [inside, setInside] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(false);

  const load = async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const l = await api<Labour>(`/labours/${params.id}`);
      setLabour(l);
      // Check if currently inside
      const list = await api<any[]>("/attendance/inside");
      setInside(list.some((r) => r.labour_id === l.labour_id));
    } catch (e: any) {
      toast.show(e?.message || "Labour not found", "error");
      if (e instanceof ApiError && e.status === 404) {
        setTimeout(() => router.back(), 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [params.id]);

  const checkIn = async () => {
    if (!labour) return;
    setAction(true);
    try {
      await api(`/labours/${labour.labour_id}/checkin`, { method: "POST" });
      toast.show("Checked in successfully", "success");
      setInside(true);
    } catch (e: any) {
      toast.show(e?.message || "Check-in failed", "error");
    } finally {
      setAction(false);
    }
  };

  const checkOut = async () => {
    if (!labour) return;
    setAction(true);
    try {
      const rec = await api<any>(`/labours/${labour.labour_id}/checkout`, { method: "POST" });
      toast.show(`Checked out • ${rec.total_hours}h worked`, "success");
      setInside(false);
    } catch (e: any) {
      toast.show(e?.message || "Check-out failed", "error");
    } finally {
      setAction(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header title="Labour" back />
        <View style={styles.center}>
          <ActivityIndicator color={colors.secondary} size="large" />
        </View>
      </View>
    );
  }

  if (!labour) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title={labour.labour_id} subtitle={labour.labour_name} back />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <View style={styles.card}>
          <View style={styles.idBadge}>
            <IdCard size={14} color={colors.primary} strokeWidth={3} />
            <Text style={styles.idText}>{labour.labour_id}</Text>
          </View>

          {labour.photo_base64 ? (
            <Image source={{ uri: labour.photo_base64 }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, { backgroundColor: colors.border }]} />
          )}

          <Text style={styles.name}>{labour.labour_name}</Text>

          <View
            style={[
              styles.statusChip,
              { backgroundColor: inside ? colors.successBg : colors.warningBg, borderColor: inside ? colors.success : colors.warning },
            ]}
          >
            <Text style={[styles.statusText, { color: inside ? colors.success : colors.warning }]}>
              {inside ? "INSIDE FACTORY" : "OUTSIDE"}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Contractor</Text>
              <Text style={styles.metaValue}>{labour.contractor_name || "—"}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Category</Text>
              <Text style={styles.metaValue}>{labour.category}</Text>
            </View>
          </View>

          {labour.mobile_number || labour.aadhaar_number ? (
            <View style={styles.metaRow}>
              {labour.mobile_number ? (
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>Mobile</Text>
                  <Text style={styles.metaValue}>{labour.mobile_number}</Text>
                </View>
              ) : null}
              {labour.aadhaar_number ? (
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>Aadhaar</Text>
                  <Text style={styles.metaValue}>****{labour.aadhaar_number.slice(-4)}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {!inside ? (
            <Button
              testID="labour-checkin-btn"
              title="Check In"
              variant="success"
              size="xl"
              onPress={checkIn}
              loading={action}
              icon={<LogIn size={24} color="#fff" strokeWidth={3} />}
              style={{ marginTop: 16 }}
            />
          ) : (
            <Button
              testID="labour-checkout-btn"
              title="Check Out"
              variant="danger"
              size="xl"
              onPress={checkOut}
              loading={action}
              icon={<LogOutIcon size={24} color="#fff" strokeWidth={3} />}
              style={{ marginTop: 16 }}
            />
          )}
        </View>

        <View style={[styles.card, { marginTop: 16, alignItems: "center" }]}>
          <Text style={styles.qrTitle}>QR ID Card</Text>
          <View style={styles.qrBox}>
            <QRCode value={labour.labour_id} size={180} backgroundColor="#fff" color={colors.secondary} />
          </View>
          <Text style={styles.qrHint}>Show this to guard for fast entry</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 4,
    padding: 16,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  idBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 2,
    marginBottom: 12,
  },
  idText: { color: colors.primary, fontWeight: "900", letterSpacing: 2, fontSize: 13, marginLeft: 6 },
  photo: {
    width: "100%",
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 4,
    resizeMode: "cover",
  },
  name: { fontSize: 22, fontWeight: "900", color: colors.text, marginTop: 14 },
  statusChip: {
    alignSelf: "flex-start",
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 8,
  },
  statusText: { fontWeight: "900", letterSpacing: 1, fontSize: 11 },
  metaRow: { flexDirection: "row", marginTop: 14 },
  metaCell: { flex: 1, paddingRight: 8 },
  metaLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  metaValue: { fontSize: 14, color: colors.text, fontWeight: "700", marginTop: 2 },
  qrTitle: { fontSize: 14, fontWeight: "900", letterSpacing: 1, color: colors.secondary, marginBottom: 12 },
  qrBox: { padding: 16, borderWidth: 3, borderColor: colors.secondary, backgroundColor: "#fff", borderRadius: 4 },
  qrHint: { marginTop: 10, fontSize: 12, color: colors.textMuted, fontWeight: "600" },
});
