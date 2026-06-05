import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Building2, Plus, Pencil, Trash2, X } from "lucide-react-native";

import { Button } from "@/src/components/Button";
import { TextField } from "@/src/components/TextField";
import { useToast } from "@/src/components/Toast";
import { api } from "@/src/lib/api";
import { colors } from "@/src/lib/theme";

type Contractor = {
  id: string;
  contractor_name: string;
  contact_person?: string | null;
  mobile_number?: string | null;
  address?: string | null;
};

export default function Contractors() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [rows, setRows] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contractor | null>(null);
  const [form, setForm] = useState({ contractor_name: "", contact_person: "", mobile_number: "", address: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api<Contractor[]>("/contractors");
      setRows(data);
    } catch (e: any) {
      toast.show(e?.message || "Failed", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const openNew = () => {
    setEditing(null);
    setForm({ contractor_name: "", contact_person: "", mobile_number: "", address: "" });
    setModalOpen(true);
  };

  const openEdit = (c: Contractor) => {
    setEditing(c);
    setForm({
      contractor_name: c.contractor_name,
      contact_person: c.contact_person || "",
      mobile_number: c.mobile_number || "",
      address: c.address || "",
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.contractor_name.trim()) return toast.show("Contractor name required", "error");
    setSaving(true);
    try {
      const body = {
        contractor_name: form.contractor_name.trim(),
        contact_person: form.contact_person.trim() || null,
        mobile_number: form.mobile_number.trim() || null,
        address: form.address.trim() || null,
      };
      if (editing) {
        await api(`/contractors/${editing.id}`, { method: "PUT", body });
        toast.show("Updated", "success");
      } else {
        await api("/contractors", { method: "POST", body });
        toast.show("Contractor added", "success");
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      toast.show(e?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Contractor) => {
    try {
      await api(`/contractors/${c.id}`, { method: "DELETE" });
      toast.show("Deleted", "success");
      load();
    } catch (e: any) {
      toast.show(e?.message || "Delete failed", "error");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Building2 size={20} color={colors.primary} strokeWidth={3} />
        <Text style={styles.headerTitle}>  Contractors</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.secondary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.empty}>No contractors yet. Tap + to add.</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.contractor_name}</Text>
                {item.contact_person ? <Text style={styles.meta}>Contact: {item.contact_person}</Text> : null}
                {item.mobile_number ? <Text style={styles.meta}>📞 {item.mobile_number}</Text> : null}
                {item.address ? <Text style={styles.meta}>📍 {item.address}</Text> : null}
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity onPress={() => openEdit(item)} style={[styles.iconBtn, { backgroundColor: colors.secondary }]} testID={`edit-${item.id}`}>
                  <Pencil size={16} color={colors.primary} strokeWidth={3} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(item)} style={[styles.iconBtn, { backgroundColor: colors.danger }]} testID={`delete-${item.id}`}>
                  <Trash2 size={16} color="#fff" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        testID="contractor-add-btn"
        onPress={openNew}
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
      >
        <Plus size={28} color={colors.primaryFg} strokeWidth={3} />
      </TouchableOpacity>

      <Modal visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)} transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editing ? "Edit Contractor" : "New Contractor"}</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <X size={24} color={colors.secondary} strokeWidth={3} />
              </TouchableOpacity>
            </View>
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" bottomOffset={20}>
              <TextField testID="contractor-name-input" label="Contractor Name *" value={form.contractor_name} onChangeText={(t) => setForm({ ...form, contractor_name: t })} autoCapitalize="words" />
              <TextField testID="contractor-contact-input" label="Contact Person" value={form.contact_person} onChangeText={(t) => setForm({ ...form, contact_person: t })} autoCapitalize="words" />
              <TextField testID="contractor-mobile-input" label="Mobile Number" value={form.mobile_number} onChangeText={(t) => setForm({ ...form, mobile_number: t })} keyboardType="phone-pad" maxLength={15} />
              <TextField testID="contractor-address-input" label="Address" value={form.address} onChangeText={(t) => setForm({ ...form, address: t })} multiline numberOfLines={3} style={{ minHeight: 80 }} />
              <Button testID="contractor-save-btn" title={editing ? "Save Changes" : "Create Contractor"} onPress={save} loading={saving} size="lg" />
            </KeyboardAwareScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 4, borderBottomColor: colors.primary,
    flexDirection: "row", alignItems: "center",
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  row: { flexDirection: "row", backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 4, padding: 14, marginBottom: 10, alignItems: "center" },
  name: { fontSize: 16, fontWeight: "800", color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  iconBtn: { width: 36, height: 36, borderRadius: 4, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.secondary },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 32, fontWeight: "600" },
  fab: {
    position: "absolute", right: 18,
    width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: colors.secondary,
    shadowColor: "#000", shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 8,
  },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopWidth: 4, borderTopColor: colors.primary,
    padding: 18,
    maxHeight: "85%",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: colors.text, letterSpacing: 0.5 },
});
