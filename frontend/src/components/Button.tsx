import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { colors } from "@/src/lib/theme";

type Variant = "primary" | "secondary" | "outline" | "danger" | "success";

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  size = "lg",
  style,
  testID,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: "md" | "lg" | "xl";
  style?: ViewStyle | ViewStyle[];
  testID?: string;
}) {
  const v = variantStyles[variant];
  const heights = { md: 48, lg: 60, xl: 80 } as const;
  const fontSizes = { md: 14, lg: 16, xl: 20 } as const;
  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        { height: heights[size], backgroundColor: v.bg, borderColor: v.border, opacity: disabled ? 0.5 : 1 },
        style as any,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={{ marginRight: 10 }}>{icon}</View> : null}
          <Text style={[styles.label, { color: v.fg, fontSize: fontSizes[size] }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const variantStyles: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: colors.primaryFg, border: colors.secondary },
  secondary: { bg: colors.secondary, fg: colors.secondaryFg, border: colors.secondary },
  outline: { bg: "transparent", fg: colors.secondary, border: colors.secondary },
  danger: { bg: colors.danger, fg: "#fff", border: colors.danger },
  success: { bg: colors.success, fg: "#fff", border: colors.success },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  row: { flexDirection: "row", alignItems: "center" },
  label: { fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
});
