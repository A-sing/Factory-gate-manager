import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useRouter } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";

import { Button } from "@/src/components/Button";
import { Header } from "@/src/components/Header";
import { PhotoCapture } from "@/src/components/PhotoCapture";
import { TextField } from "@/src/components/TextField";
import { useToast } from "@/src/components/Toast";
import { api } from "@/src/lib/api";
import { colors } from "@/src/lib/theme";

export default function VisitorEntry() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [purpose, setPurpose] = useState("");
  const [gate, setGate] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) return toast.show("Visitor name is required", "error");
    if (!purpose.trim()) return toast.show("Purpose is required", "error");
    setLoading(true);
    try {
      await api("/visitors", {
        method: "POST",
        body: {
          visitor_name: name.trim(),
          mobile_number: mobile.trim() || null,
          purpose: purpose.trim(),
          gate_name: gate.trim() || null,
          photo_base64: photo || null,
        },
      });
      toast.show("Visitor entry recorded", "success");
      router.back();
    } catch (e: any) {
      toast.show(e?.message || "Failed to save", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Visitor Entry" subtitle="New visitor record" back />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        <View style={styles.card}>
          <TextField
            testID="visitor-name-input"
            label="Visitor Name *"
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            autoCapitalize="words"
          />
          <TextField
            testID="visitor-mobile-input"
            label="Mobile Number"
            value={mobile}
            onChangeText={setMobile}
            placeholder="Optional"
            keyboardType="phone-pad"
            maxLength={15}
          />
          <TextField
            testID="visitor-purpose-input"
            label="Purpose of Visit *"
            value={purpose}
            onChangeText={setPurpose}
            placeholder="Meeting, Delivery, ..."
          />
          <TextField
            testID="visitor-gate-input"
            label="Gate"
            value={gate}
            onChangeText={setGate}
            placeholder="Gate 1, Gate 2, ..."
          />
          <PhotoCapture
            testID="visitor-photo"
            value={photo}
            onChange={(b) => setPhoto(b || null)}
            label="Visitor Photo"
          />
          <Button
            testID="visitor-submit-btn"
            title="Submit Entry"
            onPress={submit}
            loading={loading}
            size="xl"
            icon={<CheckCircle2 size={22} color={colors.primaryFg} strokeWidth={3} />}
          />
        </View>
      </KeyboardAwareScrollView>
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
});
