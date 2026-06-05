import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Building, Lock, Plus, Settings as SettingsIcon, Tag, Trash2, UserPlus, X } from "lucide-react-native";

import { Button } from "@/src/components/Button";
import { TextField } from "@/src/components/TextField";
import { useToast } from "@/src/components/Toast";
import { api } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";
import { useSettings } from "@/src/lib/settings";
import { colors } from "@/src/lib/theme";

type User = { id: string; name: string; username: string; role: "admin" | "guard" };

export default function Settings() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { user } = useAuth();
  const { settings, refresh } = useSettings();

  const [businessName, setBusinessName] = useState(settings.business_name);
  const [savingBiz, setSavingBiz] = useState(false);

  // password
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  // users
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [pwUser, setPwUser] = useState<User | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const data = await api<User[]>("/users");
      setUsers(data);
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setUsersLoading(true); loadUsers(); }, [loadUsers]));
  useEffect(() => setBusinessName(settings.business_name), [settings.business_name]);

  const saveBiz = async () => {
    if (!businessName.trim()) return toast.show("Name required", "error");
    setSavingBiz(true);
    try {
      await api("/settings", { method: "PUT", body: { business_name: businessName.trim() } });
      await refresh();
      toast.show("Business name updated", "success");
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    } finally {
      setSavingBiz(false);
    }
  };

  const changeMyPw = async () => {
    if (!curPw || !newPw) return toast.show("Fill both fields", "error");
    if (newPw.length < 6) return toast.show("New password ≥ 6 chars", "error");
    setSavingPw(true);
    try {
      await api("/auth/change-password", { method: "POST", body: { current_password: curPw, new_password: newPw } });
      setCurPw(""); setNewPw("");
      toast.show("Password changed", "success");
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    } finally {
      setSavingPw(false);
    }
  };

  const deleteUser = async (u: User) => {
    try {
      await api(`/users/${u.id}`, { method: "DELETE" });
      toast.show("User deleted", "success");
      loadUsers();
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <SettingsIcon size={20} color={colors.secondary} strokeWidth={3} />
        <Text style={styles.headerTitle}>  Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 32 }}>
        {/* Business Name */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Building size={18} color={colors.text} strokeWidth={3} />
            <Text style={styles.cardTitle}>  Business Name</Text>
          </View>
          <TextField
            testID="settings-bizname-input"
            label="Display Name"
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="e.g. ACME Industries"
            autoCapitalize="words"
          />
          <Button testID="settings-bizname-save" title="Save" size="md" onPress={saveBiz} loading={savingBiz} />
        </View>

        {/* Change My Password */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Lock size={18} color={colors.text} strokeWidth={3} />
            <Text style={styles.cardTitle}>  Change My Password</Text>
          </View>
          <Text style={styles.subtle}>{user?.username} ({user?.role})</Text>
          <TextField
            testID="settings-curpw"
            label="Current password"
            value={curPw}
            onChangeText={setCurPw}
            secureTextEntry
          />
          <TextField
            testID="settings-newpw"
            label="New password (≥ 6 chars)"
            value={newPw}
            onChangeText={setNewPw}
            secureTextEntry
          />
          <Button testID="settings-pw-save" title="Update Password" size="md" onPress={changeMyPw} loading={savingPw} />
        </View>

        {/* User Management */}
        <View style={styles.card}>
          <View style={[styles.cardHead, { justifyContent: "space-between" }]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <UserPlus size={18} color={colors.text} strokeWidth={3} />
              <Text style={styles.cardTitle}>  Users & Guards</Text>
            </View>
            <TouchableOpacity
              testID="settings-add-user-btn"
              onPress={() => setNewUserOpen(true)}
              style={styles.addBtn}
            >
              <Plus size={16} color={colors.text} strokeWidth={3} />
              <Text style={styles.addBtnText}>  ADD</Text>
            </TouchableOpacity>
          </View>
          {usersLoading ? (
            <ActivityIndicator color={colors.secondary} />
          ) : (
            users.map((u) => (
              <View key={u.id} style={styles.userRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{u.name}</Text>
                  <Text style={styles.userMeta}>
                    @{u.username} • <Text style={{ color: u.role === "admin" ? colors.secondary : colors.text }}>{u.role.toUpperCase()}</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  testID={`user-pw-${u.id}`}
                  onPress={() => setPwUser(u)}
                  style={[styles.iconBtn, { backgroundColor: colors.primary }]}
                >
                  <Lock size={14} color={colors.text} strokeWidth={3} />
                </TouchableOpacity>
                {u.id !== user?.id ? (
                  <TouchableOpacity
                    testID={`user-del-${u.id}`}
                    onPress={() => deleteUser(u)}
                    style={[styles.iconBtn, { backgroundColor: colors.danger, marginLeft: 6 }]}
                  >
                    <Trash2 size={14} color="#fff" strokeWidth={3} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          )}
        </View>

        {/* Dropdown lists */}
        <ListEditor
          icon={<Tag size={18} color={colors.text} strokeWidth={3} />}
          title="Labour Categories"
          field="labour_categories"
          items={settings.labour_categories}
          refresh={refresh}
        />
        <ListEditor
          icon={<Tag size={18} color={colors.text} strokeWidth={3} />}
          title="Visit Purposes"
          field="visit_purposes"
          items={settings.visit_purposes}
          refresh={refresh}
        />
        <ListEditor
          icon={<Tag size={18} color={colors.text} strokeWidth={3} />}
          title="Gates"
          field="gates"
          items={settings.gates}
          refresh={refresh}
        />
      </ScrollView>

      <NewUserModal
        visible={newUserOpen}
        onClose={() => setNewUserOpen(false)}
        onSaved={() => { setNewUserOpen(false); loadUsers(); }}
      />
      <PasswordModal
        user={pwUser}
        onClose={() => setPwUser(null)}
      />
    </View>
  );
}

function ListEditor({
  icon, title, field, items, refresh,
}: {
  icon: React.ReactNode;
  title: string;
  field: "labour_categories" | "visit_purposes" | "gates";
  items: string[];
  refresh: () => Promise<void>;
}) {
  const toast = useToast();
  const [newItem, setNewItem] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async () => {
    const v = newItem.trim();
    if (!v) return;
    if (items.includes(v)) { toast.show("Already exists", "error"); return; }
    setSaving(true);
    try {
      await api("/settings", { method: "PUT", body: { [field]: [...items, v] } });
      await refresh();
      setNewItem("");
    } catch (e: any) { toast.show(e?.message || "Failed", "error"); }
    finally { setSaving(false); }
  };

  const remove = async (v: string) => {
    try {
      await api("/settings", { method: "PUT", body: { [field]: items.filter((x) => x !== v) } });
      await refresh();
    } catch (e: any) { toast.show(e?.message || "Failed", "error"); }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        {icon}
        <Text style={styles.cardTitle}>  {title}</Text>
      </View>
      <View style={styles.chipWrap}>
        {items.map((v) => (
          <View key={v} style={styles.chip}>
            <Text style={styles.chipText}>{v}</Text>
            <TouchableOpacity onPress={() => remove(v)} hitSlop={8} style={{ marginLeft: 8 }} testID={`${field}-rm-${v}`}>
              <X size={14} color={colors.text} strokeWidth={3} />
            </TouchableOpacity>
          </View>
        ))}
        {items.length === 0 ? <Text style={styles.subtle}>No items yet.</Text> : null}
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 8 }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <TextField
            testID={`${field}-input`}
            label="Add new"
            value={newItem}
            onChangeText={setNewItem}
            placeholder="Type and tap Add"
            onSubmitEditing={add}
          />
        </View>
        <Button title="Add" size="md" onPress={add} loading={saving} style={{ marginBottom: 14 }} testID={`${field}-add-btn`} />
      </View>
    </View>
  );
}

function NewUserModal({
  visible, onClose, onSaved,
}: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"guard" | "admin">("guard");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || !username.trim() || !password) return toast.show("Fill all fields", "error");
    if (password.length < 6) return toast.show("Password ≥ 6 chars", "error");
    setSaving(true);
    try {
      await api("/users", {
        method: "POST",
        body: { name: name.trim(), username: username.trim().toLowerCase(), password, role },
      });
      toast.show("User created", "success");
      setName(""); setUsername(""); setPassword(""); setRole("guard");
      onSaved();
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New User</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color={colors.text} strokeWidth={3} /></TouchableOpacity>
          </View>
          <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" bottomOffset={20}>
            <TextField testID="newuser-name" label="Full Name" value={name} onChangeText={setName} autoCapitalize="words" />
            <TextField testID="newuser-username" label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
            <TextField testID="newuser-password" label="Password (≥ 6 chars)" value={password} onChangeText={setPassword} secureTextEntry />
            <Text style={styles.label}>Role</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              {(["guard", "admin"] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  testID={`newuser-role-${r}`}
                  onPress={() => setRole(r)}
                  style={[styles.roleChip, role === r && styles.roleChipActive]}
                >
                  <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>{r.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button testID="newuser-save" title="Create User" onPress={save} loading={saving} size="lg" />
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PasswordModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [pw, setPw] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!user) setPw(""); }, [user]);

  const save = async () => {
    if (!user) return;
    if (pw.length < 6) return toast.show("Password ≥ 6 chars", "error");
    setSaving(true);
    try {
      await api(`/users/${user.id}`, { method: "PUT", body: { password: pw } });
      toast.show("Password updated", "success");
      onClose();
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={!!user} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Set Password</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color={colors.text} strokeWidth={3} /></TouchableOpacity>
          </View>
          <Text style={styles.subtle}>For @{user?.username}</Text>
          <TextField
            testID="setpw-input"
            label="New password (≥ 6 chars)"
            value={pw}
            onChangeText={setPw}
            secureTextEntry
          />
          <Button testID="setpw-save" title="Update Password" size="lg" onPress={save} loading={saving} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 4, borderBottomColor: colors.primary,
    flexDirection: "row", alignItems: "center",
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 2, borderColor: colors.border,
    borderRadius: 4, padding: 14, marginBottom: 14,
  },
  cardHead: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: "900", color: colors.text, letterSpacing: 1, textTransform: "uppercase" },
  subtle: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  label: {
    fontSize: 12, fontWeight: "700", letterSpacing: 1, color: colors.text,
    textTransform: "uppercase", marginBottom: 6,
  },
  addBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 4, borderWidth: 2, borderColor: colors.secondary,
  },
  addBtnText: { color: colors.text, fontWeight: "900", fontSize: 11, letterSpacing: 1 },
  userRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  userName: { fontSize: 15, fontWeight: "800", color: colors.text },
  userMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  iconBtn: {
    width: 32, height: 32, borderRadius: 4, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: colors.secondary,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.surfaceElevated, borderWidth: 2, borderColor: colors.secondary,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4,
  },
  chipText: { fontSize: 13, fontWeight: "700", color: colors.text },
  roleChip: {
    flex: 1, height: 44, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: colors.border, borderRadius: 4, backgroundColor: colors.surface,
  },
  roleChipActive: { backgroundColor: colors.primary, borderColor: colors.secondary },
  roleChipText: { fontSize: 13, fontWeight: "800", color: colors.text, letterSpacing: 1 },
  roleChipTextActive: { color: colors.text },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: colors.surface, borderTopWidth: 4, borderTopColor: colors.primary,
    padding: 18, maxHeight: "85%",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: colors.text, letterSpacing: 0.5 },
});
