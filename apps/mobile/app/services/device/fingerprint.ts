import * as Application from "expo-application"
import * as Crypto from "expo-crypto"

export async function getDeviceFingerprint(): Promise<string> {
  const raw = [
    Application.applicationId,
    Application.nativeBuildVersion,
    Application.nativeApplicationVersion,
  ]
    .filter(Boolean)
    .join(":")

  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw)
  return hash
}
