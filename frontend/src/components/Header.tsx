import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { colors } from "@/src/lib/theme";

export function Header({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 12 }]}>
      <View style={styles.row}>
        {back ? (
          <TouchableOpacity
            testID="header-back-btn"
            onPress={() => router.back()}
            style={styles.iconBtn}
            hitSlop={12}
          >
            <ArrowLeft size={24} color={colors.text} strokeWidth={3} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.right}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 4,
    borderBottomColor: colors.primary,
  },
  row: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 20,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  subtitle: { color: colors.text, fontSize: 12, marginTop: 2 },
  right: { minWidth: 44, alignItems: "flex-end" },
});
