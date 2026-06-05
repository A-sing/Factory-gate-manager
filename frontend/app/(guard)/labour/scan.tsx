import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";

import { Button } from "@/src/components/Button";
import { Header } from "@/src/components/Header";
import { useToast } from "@/src/components/Toast";
import { colors } from "@/src/lib/theme";

export default function ScanLabour() {
  const router = useRouter();
  const toast = useToast();
  const [perm, requestPerm] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!perm) return;
    if (!perm.granted && perm.canAskAgain) requestPerm();
  }, [perm]);

  const handleScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    // Accept either raw labour ID or any string containing LAB-XXXXXX
    const match = data.match(/LAB-\d{4,}/i);
    const labourId = match ? match[0].toUpperCase() : data.trim();
    if (!labourId) {
      toast.show("Invalid QR code", "error");
      setTimeout(() => setScanned(false), 1500);
      return;
    }
    router.replace(`/(guard)/labour/detail?id=${labourId}`);
  };

  if (!perm) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.secondary} />
      </View>
    );
  }

  if (!perm.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header title="Scan QR" back />
        <View style={[styles.center, { padding: 24 }]}>
          <Text style={styles.permTitle}>Camera permission required</Text>
          <Text style={styles.permText}>
            We need the camera to scan labour QR codes. No images are stored from scanning.
          </Text>
          <Button
            testID="scan-permission-btn"
            title={perm.canAskAgain ? "Allow camera" : "Open settings"}
            onPress={async () => {
              if (perm.canAskAgain) {
                await requestPerm();
              } else {
                const { Linking } = await import("react-native");
                Linking.openSettings();
              }
            }}
            size="lg"
            style={{ marginTop: 20, alignSelf: "stretch" }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Header title="Scan QR" subtitle="Point camera at code" back />
      <View style={{ flex: 1 }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={scanned ? undefined : handleScanned}
        />
        <View style={styles.frameOverlay} pointerEvents="none">
          <View style={styles.frame} />
          <Text style={styles.frameText}>Align QR inside frame</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  permTitle: { fontWeight: "900", fontSize: 18, color: colors.text, marginBottom: 8, textAlign: "center" },
  permText: { color: colors.textMuted, textAlign: "center", fontSize: 14 },
  frameOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: 260,
    height: 260,
    borderWidth: 4,
    borderColor: colors.primary,
    borderRadius: 8,
  },
  frameText: {
    marginTop: 16,
    color: colors.primary,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
