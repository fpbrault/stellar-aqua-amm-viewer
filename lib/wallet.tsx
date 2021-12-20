import albedo from "@albedo-link/intent";
import { verifyMessageSignature } from "@albedo-link/signature-verification";
import crypto from "crypto";

export async function albedoWallet(): Promise<string> {
  const token = crypto.randomBytes(48).toString("hex");
  const result = await albedo.publicKey({
    token: token
  });

  const isValid = verifyMessageSignature(result.pubkey, token, result.signature);
  if (!isValid) {
    throw new Error("Albedo message signature is not valid");
  }
  return result.pubkey;
}
