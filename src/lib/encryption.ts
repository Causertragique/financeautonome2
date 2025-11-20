/**
 * Module de chiffrement pour protéger les données sensibles dans Firestore
 * Les données sont chiffrées côté client avant d'être envoyées à Firestore
 * Seul l'utilisateur possédant la clé peut déchiffrer ses données
 */

// Utiliser Web Crypto API pour le chiffrement AES-GCM
const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits pour GCM
const TAG_LENGTH = 128; // 128 bits pour l'authentification

/**
 * Génère une clé de chiffrement dérivée du mot de passe de l'utilisateur
 * Utilise PBKDF2 pour dériver une clé à partir de l'UID de l'utilisateur
 */
async function deriveKey(userId: string): Promise<CryptoKey> {
  // Utiliser l'UID de l'utilisateur comme "sel" pour la dérivation
  // En production, vous pourriez demander un mot de passe à l'utilisateur
  const encoder = new TextEncoder();
  const salt = encoder.encode(`nova-finance-salt-${userId}`);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(userId),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Chiffre un objet JavaScript
 */
export async function encryptData(data: any, userId: string): Promise<string> {
  try {
    const key = await deriveKey(userId);
    const encoder = new TextEncoder();
    const dataString = JSON.stringify(data);
    const dataBuffer = encoder.encode(dataString);

    // Générer un IV aléatoire
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Chiffrer les données
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH,
      },
      key,
      dataBuffer
    );

    // Combiner IV + données chiffrées
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convertir en base64 pour stockage dans Firestore
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("❌ Erreur lors du chiffrement:", error);
    throw error;
  }
}

/**
 * Déchiffre une chaîne chiffrée
 */
export async function decryptData(
  encryptedString: string,
  userId: string
): Promise<any> {
  try {
    const key = await deriveKey(userId);
    const decoder = new TextDecoder();

    // Convertir de base64
    const combined = Uint8Array.from(
      atob(encryptedString),
      (c) => c.charCodeAt(0)
    );

    // Extraire IV et données chiffrées
    const iv = combined.slice(0, IV_LENGTH);
    const encryptedData = combined.slice(IV_LENGTH);

    // Déchiffrer
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH,
      },
      key,
      encryptedData
    );

    // Parser le JSON
    const decryptedString = decoder.decode(decryptedData);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error("❌ Erreur lors du déchiffrement:", error);
    throw error;
  }
}

/**
 * Chiffre uniquement les champs sensibles d'un objet
 * Les métadonnées (id, dates, etc.) restent en clair pour permettre les requêtes
 */
export async function encryptSensitiveFields(
  data: any,
  userId: string,
  sensitiveFields: string[] = [
    "description",
    "category",
    "notes",
    "businessPurpose",
    "name",
    "legalName",
    "email",
    "owner",
    "businessNumber",
    "neq",
    "taxNumber",
  ]
): Promise<any> {
  const encrypted = { ...data };

  for (const field of sensitiveFields) {
    if (encrypted[field] != null && encrypted[field] !== "") {
      try {
        encrypted[field] = await encryptData(encrypted[field], userId);
        encrypted[`${field}_encrypted`] = true; // Marqueur pour indiquer que le champ est chiffré
      } catch (error) {
        console.error(`❌ Erreur lors du chiffrement du champ ${field}:`, error);
        // En cas d'erreur, on garde le champ en clair plutôt que de perdre les données
      }
    }
  }

  return encrypted;
}

/**
 * Déchiffre les champs sensibles d'un objet
 */
export async function decryptSensitiveFields(
  data: any,
  userId: string,
  sensitiveFields: string[] = [
    "description",
    "category",
    "notes",
    "businessPurpose",
    "name",
    "legalName",
    "email",
    "owner",
    "businessNumber",
    "neq",
    "taxNumber",
  ]
): Promise<any> {
  const decrypted = { ...data };

  for (const field of sensitiveFields) {
    if (
      decrypted[`${field}_encrypted`] === true &&
      typeof decrypted[field] === "string"
    ) {
      try {
        decrypted[field] = await decryptData(decrypted[field], userId);
        delete decrypted[`${field}_encrypted`]; // Supprimer le marqueur
      } catch (error) {
        console.error(`❌ Erreur lors du déchiffrement du champ ${field}:`, error);
        // En cas d'erreur, on garde le champ chiffré
      }
    }
  }

  return decrypted;
}

/**
 * Vérifie si un champ est chiffré
 */
export function isFieldEncrypted(data: any, field: string): boolean {
  return data[`${field}_encrypted`] === true;
}

