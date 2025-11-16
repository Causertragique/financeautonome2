import { useEffect, useState } from "react";
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, type Analytics } from "firebase/analytics";

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export function useFirebase() {
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier que toutes les variables d'environnement sont présentes
    const firebaseConfig: FirebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    };

    // Vérifier que toutes les variables requises sont présentes
    const requiredVars = [
      "apiKey",
      "authDomain",
      "projectId",
      "storageBucket",
      "messagingSenderId",
      "appId",
    ];

    const missingVars = requiredVars.filter(
      (key) => !firebaseConfig[key as keyof FirebaseConfig]
    );

    if (missingVars.length > 0) {
      setError(
        `Variables Firebase manquantes: ${missingVars.join(", ")}`
      );
      setIsInitialized(true);
      return;
    }

    try {
      // Initialiser Firebase
      const firebaseApp = initializeApp(firebaseConfig);
      setApp(firebaseApp);

      // Initialiser Analytics uniquement dans le navigateur
      if (typeof window !== "undefined") {
        try {
          const analyticsInstance = getAnalytics(firebaseApp);
          setAnalytics(analyticsInstance);
        } catch (analyticsError) {
          console.warn("⚠️ Analytics n'a pas pu être initialisé:", analyticsError);
        }
      }

      setIsInitialized(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      setError(`Erreur d'initialisation Firebase: ${errorMessage}`);
      setIsInitialized(true);
    }
  }, []);

  return { app, analytics, isInitialized, error };
}

