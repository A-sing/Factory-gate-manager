import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { getToken } from "@/src/lib/api";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  // global btoa is available in Hermes / RN
  // eslint-disable-next-line no-undef
  return globalThis.btoa(binary);
}

/**
 * Download a file from a protected backend endpoint and save it to the device.
 * Triggers a share/save sheet on native; on web, triggers a browser download.
 */
export async function downloadAndShare(opts: {
  path: string;        // e.g. "/visitors/export"
  query?: Record<string, string | number | undefined | null>;
  filename: string;    // e.g. "visitors_20260101.xlsx"
  mime: string;        // e.g. "application/pdf"
}): Promise<{ uri?: string }> {
  const token = await getToken();
  const qs = new URLSearchParams();
  Object.entries(opts.query || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
  });
  const url = `${BASE}/api${opts.path}${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Download failed (${res.status})`);
  }

  if (Platform.OS === "web") {
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    // eslint-disable-next-line no-undef
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = opts.filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
    return {};
  }

  const buf = await res.arrayBuffer();
  const base64 = bytesToBase64(new Uint8Array(buf));
  const fileUri = `${FileSystem.cacheDirectory}${opts.filename}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: opts.mime, dialogTitle: "Save report" });
  }
  return { uri: fileUri };
}
