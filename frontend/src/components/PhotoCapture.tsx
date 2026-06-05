import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera as CamIcon, RotateCcw, X, Image as ImageIcon } from "lucide-react-native";
import { colors } from "@/src/lib/theme";
import { Button } from "./Button";

type Props = {
  value: string | null;
  onChange: (base64: string) => void;
  label?: string;
  testID?: string;
};

export function PhotoCapture({ value, onChange, label = "Photo", testID }: Props) {
  const [perm, requestPerm] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [capturing, setCapturing] = useState(false);
  const insets = useSafeAreaInsets();

  const openCamera = async () => {
    if (!perm?.granted) {
      const r = await requestPerm();
      if (!r.granted) return;
    }
    setCameraOpen(true);
  };

  const takePicture = async () => {
    if (!cameraRef || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.takePictureAsync({ base64: true, quality: 0.5 });
      if (photo?.base64) {
        onChange(`data:image/jpeg;base64,${photo.base64}`);
      }
    } finally {
      setCapturing(false);
      setCameraOpen(false);
    }
  };

  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.5,
      allowsEditing: true,
    });
    if (!res.canceled && res.assets[0]?.base64) {
      onChange(`data:image/jpeg;base64,${res.assets[0].base64}`);
    }
  };

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {value ? (
        <View style={styles.preview}>
          <Image source={{ uri: value }} style={styles.image} />
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => onChange("")}
            testID={`${testID}-clear`}
          >
            <X size={20} color="#fff" strokeWidth={3} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.row}>
          <Button
            title="Camera"
            variant="secondary"
            icon={<CamIcon size={18} color="#fff" strokeWidth={3} />}
            onPress={openCamera}
            size="md"
            style={{ flex: 1, marginRight: 8 }}
            testID={`${testID}-camera-btn`}
          />
          <Button
            title="Gallery"
            variant="outline"
            icon={<ImageIcon size={18} color={colors.secondary} strokeWidth={3} />}
            onPress={pickFromGallery}
            size="md"
            style={{ flex: 1 }}
            testID={`${testID}-gallery-btn`}
          />
        </View>
      )}

      <Modal visible={cameraOpen} animationType="slide" onRequestClose={() => setCameraOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <CameraView
            ref={(r) => setCameraRef(r)}
            facing={facing}
            style={{ flex: 1 }}
          />
          <View style={[styles.cameraTop, { top: insets.top + 8 }]}>
            <TouchableOpacity style={styles.cameraIcon} onPress={() => setCameraOpen(false)}>
              <X size={28} color="#fff" strokeWidth={3} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cameraIcon}
              onPress={() => setFacing(facing === "back" ? "front" : "back")}
            >
              <RotateCcw size={28} color="#fff" strokeWidth={3} />
            </TouchableOpacity>
          </View>
          <View style={[styles.cameraBottom, { paddingBottom: insets.bottom + 24 }]}>
            <TouchableOpacity
              testID="photo-capture-shoot-btn"
              style={styles.shutter}
              onPress={takePicture}
              disabled={capturing}
            >
              {capturing ? <ActivityIndicator color="#000" /> : <View style={styles.shutterInner} />}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.secondary,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  row: { flexDirection: "row" },
  preview: {
    width: "100%",
    height: 220,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  clearBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.danger,
    width: 36,
    height: 36,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  cameraTop: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cameraIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingTop: 16,
  },
  shutter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.primary,
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary },
});
