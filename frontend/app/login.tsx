import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useRouter } from "expo-router";
import { Shield, User as UserIcon, Lock } from "lucide-react-native";

import { Button } from "@/src/components/Button";
import { TextField } from "@/src/components/TextField";
import { useToast } from "@/src/components/Toast";
import { useAuth } from "@/src/lib/auth";
import { useSettings } from "@/src/lib/settings";
import { colors } from "@/src/lib/theme";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { settings } = useSettings();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      toast.show("Enter username and password", "error");
      return;
    }
    setLoading(true);
    try {
      const u = await login(username.trim().toLowerCase(), password);
      toast.show(`Welcome, ${u.name}`, "success");
      router.replace(u.role === "admin" ? "/(admin)/dashboard" : "/(guard)/home");
    } catch (e: any) {
      toast.show(e?.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Shield size={48} color={colors.primary} strokeWidth={3} />
          </View>
          <Text style={styles.title}>{(settings.business_name || "DBS FACTORY").toUpperCase()}</Text>
          <Text style={styles.subtitle}>Gate Management System</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>GUARD LOGIN</Text>
          <TextField
            testID="login-username-input"
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="admin or guard"
          />
          <TextField
            testID="login-password-input"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          <Button
            testID="login-submit-button"
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            icon={<Lock size={18} color={colors.primaryFg} strokeWidth={3} />}
          />
        </View>

        <View style={styles.hint}>
          <UserIcon size={14} color={colors.textMuted} strokeWidth={2.5} />
          <Text style={styles.hintText}>  Default: admin/admin123  •  guard/guard123</Text>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  logoBox: {
    width: 96,
    height: 96,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 2,
  },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, letterSpacing: 1, textTransform: "uppercase" },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 4,
    padding: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
    color: colors.text,
    marginBottom: 20,
    textAlign: "center",
  },
  hint: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 24 },
  hintText: { color: colors.textMuted, fontSize: 12 },
});
