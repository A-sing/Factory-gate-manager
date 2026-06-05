import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/src/lib/theme";

type ToastKind = "success" | "error" | "info";
type ToastState = { message: string; kind: ToastKind } | null;

const ToastCtx = createContext<{ show: (m: string, k?: ToastKind) => void } | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, kind: ToastKind = "info") => {
    setState({ message, kind });
  }, []);

  useEffect(() => {
    if (!state) return;
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setState(null);
      });
    }, 2400);
    return () => clearTimeout(t);
  }, [state, opacity]);

  const bg =
    state?.kind === "success" ? colors.success : state?.kind === "error" ? colors.danger : colors.secondary;

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      {state ? (
        <View pointerEvents="none" style={[styles.wrap, { top: insets.top + 8 }]} testID="toast">
          <Animated.View style={[styles.toast, { opacity, backgroundColor: bg }]}>
            <Text style={styles.text}>{state.message}</Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, zIndex: 1000, alignItems: "center" },
  toast: {
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: colors.secondary,
    minWidth: 200,
    maxWidth: "100%",
  },
  text: { color: "#fff", fontWeight: "700", textAlign: "center" },
});
