import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

type UsageType = "business" | "personal" | "both" | null;
type CurrentMode = "business" | "personal";

interface UsageModeContextType {
  usageType: UsageType;
  currentMode: CurrentMode;
  setCurrentMode: (mode: CurrentMode) => void;
  updateUsageType: (newUsageType: "business" | "personal" | "both") => Promise<void>;
  loading: boolean;
}

const UsageModeContext = createContext<UsageModeContextType | undefined>(undefined);

export function useUsageMode() {
  const context = useContext(UsageModeContext);
  if (context === undefined) {
    throw new Error("useUsageMode doit être utilisé dans un UsageModeProvider");
  }
  return context;
}

interface UsageModeProviderProps {
  children: ReactNode;
}

export function UsageModeProvider({ children }: UsageModeProviderProps) {
  const { currentUser } = useAuth();
  const [usageType, setUsageType] = useState<UsageType>(null);
  const [currentMode, setCurrentMode] = useState<CurrentMode>("business");
  const [loading, setLoading] = useState(true);

  // Récupérer le type d'utilisation depuis Firestore
  useEffect(() => {
    const fetchUsageType = async () => {
      if (!currentUser || !db) {
        setUsageType(null);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const fetchedUsageType = userData.usageType as UsageType;
          setUsageType(fetchedUsageType || null);
          
          // Si l'utilisateur a choisi "both", initialiser le mode depuis localStorage ou par défaut "business"
          if (fetchedUsageType === "both") {
            const savedMode = localStorage.getItem(`usageMode_${currentUser.uid}`) as CurrentMode | null;
            setCurrentMode(savedMode || "business");
          } else if (fetchedUsageType === "personal") {
            setCurrentMode("personal");
          } else {
            setCurrentMode("business");
          }
        } else {
          setUsageType(null);
          setCurrentMode("business");
        }
      } catch (error) {
        console.error("❌ Erreur lors de la récupération du type d'utilisation:", error);
        setUsageType(null);
        setCurrentMode("business");
      } finally {
        setLoading(false);
      }
    };

    fetchUsageType();
  }, [currentUser]);

  // Sauvegarder le mode actuel dans localStorage quand il change (pour "both")
  useEffect(() => {
    if (currentUser && usageType === "both") {
      localStorage.setItem(`usageMode_${currentUser.uid}`, currentMode);
    }
  }, [currentMode, usageType, currentUser]);

  // Fonction pour mettre à jour le type d'utilisation dans Firestore
  const updateUsageType = async (newUsageType: "business" | "personal" | "both") => {
    if (!currentUser || !db) {
      throw new Error("Utilisateur non connecté ou Firestore non disponible");
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, {
        usageType: newUsageType,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Mettre à jour l'état local
      setUsageType(newUsageType);
      
      // Ajuster le mode actuel selon le nouveau type
      if (newUsageType === "both") {
        const savedMode = localStorage.getItem(`usageMode_${currentUser.uid}`) as CurrentMode | null;
        setCurrentMode(savedMode || "business");
      } else if (newUsageType === "personal") {
        setCurrentMode("personal");
      } else {
        setCurrentMode("business");
      }

      console.log("✅ Type d'utilisation mis à jour:", newUsageType);
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du type d'utilisation:", error);
      throw error;
    }
  };

  const value: UsageModeContextType = {
    usageType,
    currentMode,
    setCurrentMode,
    updateUsageType,
    loading,
  };

  return <UsageModeContext.Provider value={value}>{children}</UsageModeContext.Provider>;
}

