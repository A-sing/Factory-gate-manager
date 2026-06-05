import { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useRouter } from "expo-router";
import { Search as SearchIcon, ChevronRight } from "lucide-react-native";

import { Button } from "@/src/components/Button";
import { Header } from "@/src/components/Header";
import { TextField } from "@/src/components/TextField";
import { useToast } from "@/src/components/Toast";
import { api } from "@/src/lib/api";
import { colors } from "@/src/lib/theme";

type Labour = {
  labour_id: string;
  labour_name: string;
  contractor_name?: string | null;
  category: string;
};

export default function SearchLabour() {
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Labour[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!q.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const data = await api<Labour[]>("/labours", { query: { q: q.trim(), limit: 50 } });
      setResults(data);
    } catch (e: any) {
      toast.show(e?.message || "Search failed", "error");
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Search Labour" subtitle="ID, Name or Aadhaar" back />
      <View style={{ padding: 16 }}>
        <View style={styles.card}>
          <TextField
            testID="labour-search-input"
            label="Search"
            value={q}
            onChangeText={setQ}
            placeholder="LAB-000001, name, aadhaar..."
            onSubmitEditing={search}
            returnKeyType="search"
          />
          <Button
            testID="labour-search-submit-btn"
            title="Search"
            onPress={search}
            size="lg"
            loading={searching}
            icon={<SearchIcon size={18} color={colors.primaryFg} strokeWidth={3} />}
          />
        </View>
      </View>

      {searching ? (
        <ActivityIndicator color={colors.secondary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(i) => i.labour_id}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          ListEmptyComponent={
            searched ? (
              <Text style={styles.empty}>No labour found for "{q}"</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`labour-result-${item.labour_id}`}
              activeOpacity={0.8}
              onPress={() => router.push(`/(guard)/labour/detail?id=${item.labour_id}`)}
              style={styles.row}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowId}>{item.labour_id}</Text>
                <Text style={styles.rowName}>{item.labour_name}</Text>
                <Text style={styles.rowMeta}>
                  {item.contractor_name || "—"} • {item.category}
                </Text>
              </View>
              <ChevronRight size={24} color={colors.secondary} strokeWidth={3} />
            </TouchableOpacity>
          )}
        />
      )}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 14,
    marginBottom: 10,
  },
  rowId: { fontSize: 12, fontWeight: "800", color: colors.primary, backgroundColor: colors.secondary, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 2, letterSpacing: 1 },
  rowName: { fontSize: 17, fontWeight: "800", color: colors.text, marginTop: 6 },
  rowMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 32, fontWeight: "600" },
});
