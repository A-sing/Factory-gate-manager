import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";

import { Button } from "@/src/components/Button";
import { Header } from "@/src/components/Header";
import { PhotoCapture } from "@/src/components/PhotoCapture";
import { TextField } from "@/src/components/TextField";
import { useToast } from "@/src/components/Toast";
import { api } from "@/src/lib/api";
import { colors, LABOUR_CATEGORIES } from "@/src/lib/theme";

type Contractor = { id: string; contractor_name: string };

export default function NewLabour() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contractorId, setContractorId] = useState<string>("");
  const [category, setCategory] = useState<string>("Helper");
  const [aadhaar, setAadhaar] = useState("");
  const [mobile, setMobile] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await api<Contractor[]>("/contractors");
        setContractors(list);
        if (list.length > 0) setContractorId(list[0].id);
      } catch (e: any) {
        toast.show("Failed to load contractors", "error");
      } finally {
        setLoadingList(false);
      }
    })();
  }, []);

  const submit = async () => {
    if (!name.trim()) return toast.show("Labour name is required", "error");
    if (!contractorId) return toast.show("Select a contractor (add via Admin)", "error");
    if (!photo) return toast.show("Photo is required", "error");
    setLoading(true);
    try {
      const labour = await api<{ labour_id: string }>("/labours", {
        method: "POST",
        body: {
          labour_name: name.trim(),
          contractor_id: contractorId,
          category,
          photo_base64: photo,
          aadhaar_number: aadhaar.trim() || null,
          mobile_number: mobile.trim() || null,
        },
      });
      toast.show(`Registered: ${labour.labour_id}`, "success");
      router.replace(`/(guard)/labour/detail?id=${labour.labour_id}`);
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="New Labour" subtitle="One-time registration" back />
      {loadingList ? (
        <View style={styles.center}><ActivityIndicator color={colors.secondary} /></View>
      ) : (
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          bottomOffset={20}
        >
          <View style={styles.card}>
            <TextField
              testID="newlabour-name-input"
              label="Labour Name *"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Contractor *</Text>
            {contractors.length === 0 ? (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  No contractors yet. Ask Admin to add a contractor first.
                </Text>
              </View>
            ) : (
              <View style={{ marginBottom: 14 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {contractors.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      testID={`contractor-chip-${c.id}`}
                      onPress={() => setContractorId(c.id)}
                      style={[styles.chip, contractorId === c.id && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, contractorId === c.id && styles.chipTextActive]}>
                        {c.contractor_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.label}>Category *</Text>
            <View style={{ marginBottom: 14 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {LABOUR_CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    testID={`category-chip-${c}`}
                    onPress={() => setCategory(c)}
                    style={[styles.chip, category === c && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TextField
              testID="newlabour-aadhaar-input"
              label="Aadhaar Number"
              value={aadhaar}
              onChangeText={setAadhaar}
              keyboardType="number-pad"
              maxLength={12}
              placeholder="Optional"
            />
            <TextField
              testID="newlabour-mobile-input"
              label="Mobile Number"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              maxLength={15}
              placeholder="Optional"
            />

            <PhotoCapture
              testID="newlabour-photo"
              value={photo}
              onChange={(b) => setPhoto(b || null)}
              label="Labour Photo *"
            />

            <Button
              testID="newlabour-submit-btn"
              title="Register & Generate ID"
              onPress={submit}
              loading={loading}
              size="xl"
              icon={<Check size={22} color={colors.primaryFg} strokeWidth={3} />}
            />
          </View>
        </KeyboardAwareScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 4,
    padding: 16,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.secondary,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  chipRow: { paddingVertical: 4, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.secondary },
  chipText: { fontSize: 13, fontWeight: "700", color: colors.text },
  chipTextActive: { color: colors.secondary },
  warningBox: {
    padding: 12,
    backgroundColor: colors.warningBg,
    borderWidth: 2,
    borderColor: colors.warning,
    borderRadius: 4,
    marginBottom: 14,
  },
  warningText: { color: colors.text, fontSize: 13, fontWeight: "600" },
});
