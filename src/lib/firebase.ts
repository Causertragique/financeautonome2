// Import the functions you need from the SDKs you need
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getFirestore, type Firestore } from "firebase/firestore";

// Debug: Log all VITE_ env vars
if (import.meta.env.DEV) {
  console.log("🔍 Variables d'environnement VITE_* détectées:", {
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY ? "✓ présent" : "✗ manquant",
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? "✓ présent" : "✗ manquant",
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "✓ présent" : "✗ manquant",
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? "✓ présent" : "✗ manquant",
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? "✓ présent" : "✗ manquant",
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID ? "✓ présent" : "✗ manquant",
  });
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate required configuration
const requiredEnvVars = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName] || import.meta.env[varName] === ""
);

if (missingVars.length > 0) {
  console.error(
    "❌ Variables d'environnement Firebase manquantes ou vides:",
    missingVars.join(", ")
  );
  console.error(
    "📝 Vérifiez votre fichier .env à la racine du projet."
  );
  console.error("🔍 Valeurs actuelles:", {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "✓" : "✗",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? "✓" : "✗",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? "✓" : "✗",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? "✓" : "✗",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? "✓" : "✗",
    appId: import.meta.env.VITE_FIREBASE_APP_ID ? "✓" : "✗",
  });
}

// Initialize Firebase only if all required config values are present
let app: FirebaseApp | undefined;
let analytics: Analytics | null = null;
let db: Firestore | undefined;

// Vérifier que toutes les valeurs requises sont présentes
const hasAllRequiredValues = 
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId;

if (hasAllRequiredValues) {
  try {
    app = initializeApp(firebaseConfig);
    
    // Initialize Firestore
    if (app) {
      try {
        db = getFirestore(app);
      } catch (firestoreError) {
        console.warn("⚠️ Firestore n'a pas pu être initialisé:", firestoreError);
      }
    }
    
    // Initialize Analytics (only in browser environment and if app is initialized)
    if (typeof window !== "undefined" && app) {
      try {
        analytics = getAnalytics(app);
      } catch (analyticsError) {
        console.warn("⚠️ Analytics n'a pas pu être initialisé:", analyticsError);
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de Firebase:", error);
  }
} else {
  console.warn(
    "⚠️ Firebase n'est pas initialisé car certaines variables de configuration sont manquantes."
  );
}

export { app, analytics, db };

