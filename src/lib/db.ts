import { db } from "./firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { nanoid } from "nanoid";

// ==================== TRANSACTIONS ====================

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  description?: string;
  category?: string;
  date: string; // "YYYY-MM-DD"
  type: "income" | "expense";
  company?: string;
  tags?: string[];
  mode?: "business" | "personal"; // Mode d'utilisation (business ou personal)
  createdAt?: string;
  updatedAt?: string;

  // Champs fiscaux
  gst?: number;
  qst?: number;
  isTaxable?: boolean;
  hasReceipt?: boolean;
  businessPurpose?: string;
  deductibleRatio?: number;

  // ITC (Input Tax Credits)
  gstItc?: number; // Crédit de taxe sur les intrants GST
  qstItc?: number; // Crédit de taxe sur les intrants QST

  // Classification automatique
  autoClassified?: boolean;
  classificationConfidence?: number;

  // Documents joints
  documents?: Array<{
    name: string;
    url: string;
    uploadedAt: string;
  }>;
}

/**
 * Fonction utilitaire pour obtenir le mode actuel depuis localStorage
 */
function getCurrentMode(): "business" | "personal" {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) return "business";
  
  const savedMode = localStorage.getItem(`usageMode_${userId}`) as "business" | "personal" | null;
  return savedMode || "business";
}

/**
 * Récupère les transactions pour une année donnée, filtrées par mode
 */
export async function getTransactions(year: number, mode?: "business" | "personal"): Promise<Transaction[]> {
  if (!db) {
    console.warn("❌ Firestore non initialisé");
    return [];
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn("❌ Utilisateur non authentifié");
      return [];
    }

    console.log("📥 Récupération des transactions pour l'année:", year);
    console.log("👤 UserId:", userId);

    const startDate = new Date(year, 0, 1).toISOString().split("T")[0];
    const endDate = new Date(year, 11, 31).toISOString().split("T")[0];

    console.log("📅 Période:", startDate, "à", endDate);

    // Déterminer le mode à utiliser (paramètre ou depuis localStorage)
    const currentMode = mode || getCurrentMode();
    console.log("🔍 Mode de filtrage:", currentMode);

    // Essayer d'abord la collection racine (legacy)
    let transactionsRef = collection(db, "transactions");
    let snapshot;
    
    try {
      const q = query(
        transactionsRef,
        where("userId", "==", userId),
        where("mode", "==", currentMode),
        orderBy("date", "desc")
      );
      snapshot = await getDocs(q);
      console.log("📊 Transactions trouvées dans collection racine:", snapshot.size);
    } catch (orderByError: any) {
      console.warn("⚠️ Erreur avec orderBy, récupération sans tri:", orderByError?.code);
      if (orderByError?.code === "failed-precondition") {
        console.warn("⚠️ Index Firestore manquant. Récupération sans orderBy…");
        console.warn(
          "💡 Créez un index composite sur: collection=transactions, fields=userId (Ascending), mode (Ascending), date (Descending)"
        );
      }
      const q = query(
        transactionsRef, 
        where("userId", "==", userId),
        where("mode", "==", currentMode)
      );
      snapshot = await getDocs(q);
      console.log("📊 Transactions trouvées (sans orderBy):", snapshot.size);
    }

    // Si aucune transaction trouvée, essayer la sous-collection
    if (snapshot.size === 0) {
      console.log("🔍 Aucune transaction dans la collection racine, vérification de la sous-collection...");
      try {
        transactionsRef = collection(db, "users", userId, "transactions");
        const q = query(
          transactionsRef,
          where("mode", "==", currentMode),
          orderBy("date", "desc")
        );
        snapshot = await getDocs(q);
        console.log("📊 Transactions trouvées dans sous-collection:", snapshot.size);
      } catch (subCollectionError: any) {
        console.warn("⚠️ Erreur avec la sous-collection:", subCollectionError?.code);
        if (subCollectionError?.code === "failed-precondition") {
          const q = query(
            transactionsRef,
            where("mode", "==", currentMode)
          );
          snapshot = await getDocs(q);
          console.log("📊 Transactions trouvées (sans orderBy):", snapshot.size);
        }
      }
    }

    console.log("📊 Nombre total de documents récupérés:", snapshot.size);

    const transactions: Transaction[] = [];

    snapshot.forEach((d) => {
      const data = d.data() as any;
      console.log("📄 Transaction trouvée:", d.id, "Date:", data.date, "Mode:", data.mode);

      // Filtrer par mode et par date
      if (data.date >= startDate && data.date <= endDate && data.mode === currentMode) {
        const transaction = {
          id: d.id,
          ...data,
        } as Transaction;

        if (transaction.gstItc !== undefined && transaction.gstItc !== null) {
          console.log(
            "🔍 ITC GST trouvé dans transaction:",
            d.id,
            "valeur:",
            transaction.gstItc
          );
        }
        if (transaction.qstItc !== undefined && transaction.qstItc !== null) {
          console.log(
            "🔍 ITC QST trouvé dans transaction:",
            d.id,
            "valeur:",
            transaction.qstItc
          );
        }

        transactions.push(transaction);
        console.log("✅ Transaction ajoutée à la liste:", d.id);
      } else {
        console.log("⏭️ Transaction ignorée (hors période):", d.id, "Date:", data.date);
      }
    });

    transactions.sort((a, b) => b.date.localeCompare(a.date));

    console.log("✅ Nombre de transactions retournées:", transactions.length);
    
    if (snapshot.size > 0 && transactions.length === 0) {
      console.warn("⚠️ Des transactions existent mais aucune ne correspond à l'année", year);
      console.warn("⚠️ Vérifiez que les dates des transactions sont dans la plage:", startDate, "à", endDate);
    }
    
    return transactions;
  } catch (error: any) {
    console.error("❌ Erreur lors de la récupération des transactions:", error);
    console.error("❌ Code d'erreur:", error?.code);
    console.error("❌ Message:", error?.message);
    return [];
  }
}

/**
 * Ajoute une nouvelle transaction
 */
export async function addTransaction(
  transaction: Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string | null> {
  if (!db) {
    console.warn("❌ Firestore non initialisé");
    return null;
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("❌ Utilisateur non authentifié");
      return null;
    }

    console.log("📝 Création d'une transaction:", transaction);
    console.log("👤 UserId:", userId);

    const id = nanoid();

    // Obtenir le mode actuel (depuis le paramètre ou localStorage)
    const currentMode = transaction.mode || getCurrentMode();

    const cleanedTransaction: any = {
      id,
      userId,
      date: transaction.date,
      description: transaction.description || "",
      category: transaction.category || "",
      type: transaction.type,
      amount: transaction.amount,
      tags: transaction.tags || [],
      mode: currentMode, // Ajouter le mode automatiquement
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (transaction.company) cleanedTransaction.company = transaction.company;
    if (transaction.gst !== undefined && transaction.gst !== null)
      cleanedTransaction.gst = transaction.gst;
    if (transaction.qst !== undefined && transaction.qst !== null)
      cleanedTransaction.qst = transaction.qst;
    if (transaction.isTaxable !== undefined)
      cleanedTransaction.isTaxable = transaction.isTaxable;
    if (transaction.hasReceipt !== undefined)
      cleanedTransaction.hasReceipt = transaction.hasReceipt;
    if (transaction.businessPurpose)
      cleanedTransaction.businessPurpose = transaction.businessPurpose;
    if (transaction.deductibleRatio !== undefined && transaction.deductibleRatio !== null)
      cleanedTransaction.deductibleRatio = transaction.deductibleRatio;
    if (transaction.gstItc !== undefined && transaction.gstItc !== null) {
      cleanedTransaction.gstItc = transaction.gstItc;
      console.log("📝 ITC GST ajouté:", transaction.gstItc);
    }
    if (transaction.qstItc !== undefined && transaction.qstItc !== null) {
      cleanedTransaction.qstItc = transaction.qstItc;
      console.log("📝 ITC QST ajouté:", transaction.qstItc);
    }
    if (transaction.autoClassified !== undefined)
      cleanedTransaction.autoClassified = transaction.autoClassified;
    if (
      transaction.classificationConfidence !== undefined &&
      transaction.classificationConfidence !== null
    ) {
      cleanedTransaction.classificationConfidence = transaction.classificationConfidence;
    }

    const transactionData: Transaction = cleanedTransaction as Transaction;

    console.log("📄 Données complètes de la transaction:", transactionData);

    const transactionRef = doc(db, "transactions", id);
    console.log("🔄 Chemin du document:", `transactions/${id}`);
    console.log("🔄 Exécution de setDoc()…");

    await setDoc(transactionRef, transactionData);
    console.log("✅ Transaction créée avec succès dans Firestore");

    try {
      const verifyRef = doc(db, "transactions", id);
      const verifyDoc = await getDoc(verifyRef);
      if (verifyDoc.exists()) {
        console.log("✅ Transaction vérifiée et confirmée dans Firestore");
        console.log("📄 Contenu:", verifyDoc.data());
      } else {
        console.warn("⚠️ Transaction créée mais pas encore visible (synchronisation en cours)");
      }
    } catch (verifyError: any) {
      console.warn(
        "⚠️ Impossible de vérifier la transaction:",
        verifyError?.code,
        verifyError?.message
      );
    }

    window.dispatchEvent(new Event("transactionsUpdated"));

    return id;
  } catch (error: any) {
    console.error("❌ Erreur lors de l'ajout de la transaction:", error);
    console.error("❌ Code d'erreur:", error?.code);
    console.error("❌ Message:", error?.message);
    console.error("❌ Stack:", error?.stack);

    if (error?.code === "permission-denied") {
      console.error("❌ Permission refusée - Vérifiez les règles Firestore");
      console.error(
        "❌ Assurez-vous que les règles permettent la création pour transactions/{transactionId}"
      );
    }

    return null;
  }
}

/**
 * Met à jour une transaction existante
 */
export async function updateTransaction(
  transactionId: string,
  updates: Partial<Omit<Transaction, "id" | "userId" | "createdAt">>
): Promise<boolean> {
  if (!db) {
    console.warn("❌ Firestore non initialisé");
    return false;
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("❌ Utilisateur non authentifié");
      return false;
    }

    const transactionRef = doc(db, "transactions", transactionId);
    const transactionDoc = await getDoc(transactionRef);

    if (!transactionDoc.exists()) {
      console.error("❌ Transaction non trouvée");
      return false;
    }

    const transactionData = transactionDoc.data() as any;
    if (transactionData.userId !== userId) {
      console.error("❌ Accès refusé - La transaction n'appartient pas à l'utilisateur");
      return false;
    }

    const cleanedUpdates: any = {
      date: updates.date,
      description: updates.description || "",
      category: updates.category || "",
      type: updates.type,
      amount: updates.amount,
      tags: updates.tags || [],
      updatedAt: new Date().toISOString(),
    };

    if (updates.company) cleanedUpdates.company = updates.company;
    if (updates.gst !== undefined && updates.gst !== null)
      cleanedUpdates.gst = updates.gst;
    if (updates.qst !== undefined && updates.qst !== null)
      cleanedUpdates.qst = updates.qst;
    if (updates.isTaxable !== undefined)
      cleanedUpdates.isTaxable = updates.isTaxable;
    if (updates.hasReceipt !== undefined)
      cleanedUpdates.hasReceipt = updates.hasReceipt;
    if (updates.businessPurpose)
      cleanedUpdates.businessPurpose = updates.businessPurpose;
    if (updates.deductibleRatio !== undefined && updates.deductibleRatio !== null)
      cleanedUpdates.deductibleRatio = updates.deductibleRatio;
    if (updates.gstItc !== undefined && updates.gstItc !== null)
      cleanedUpdates.gstItc = updates.gstItc;
    if (updates.qstItc !== undefined && updates.qstItc !== null)
      cleanedUpdates.qstItc = updates.qstItc;
    if (updates.autoClassified !== undefined)
      cleanedUpdates.autoClassified = updates.autoClassified;
    if (
      updates.classificationConfidence !== undefined &&
      updates.classificationConfidence !== null
    ) {
      cleanedUpdates.classificationConfidence = updates.classificationConfidence;
    }

    await updateDoc(transactionRef, cleanedUpdates);

    console.log("✅ Transaction mise à jour avec succès");
    window.dispatchEvent(new Event("transactionsUpdated"));

    return true;
  } catch (error: any) {
    console.error("❌ Erreur lors de la mise à jour de la transaction:", error);
    console.error("❌ Code d'erreur:", error?.code);
    console.error("❌ Message:", error?.message);
    return false;
  }
}

/**
 * Supprime une transaction
 */
export async function deleteTransaction(transactionId: string): Promise<boolean> {
  if (!db) {
    console.warn("❌ Firestore non initialisé");
    return false;
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("❌ Utilisateur non authentifié");
      return false;
    }

    const transactionRef = doc(db, "transactions", transactionId);
    const transactionDoc = await getDoc(transactionRef);

    if (!transactionDoc.exists()) {
      console.error("❌ Transaction non trouvée");
      return false;
    }

    const transactionData = transactionDoc.data() as any;
    if (transactionData.userId !== userId) {
      console.error("❌ Accès refusé - La transaction n'appartient pas à l'utilisateur");
      return false;
    }

    await deleteDoc(transactionRef);
    console.log("✅ Transaction supprimée avec succès");
    window.dispatchEvent(new Event("transactionsUpdated"));

    return true;
  } catch (error: any) {
    console.error("❌ Erreur lors de la suppression de la transaction:", error);
    console.error("❌ Code d'erreur:", error?.code);
    console.error("❌ Message:", error?.message);
    return false;
  }
}

// ==================== VÉHICULE : PROFIL ANNUEL & JOURNAL ====================

export interface VehicleAnnualProfile {
  id: string;
  userId: string;
  year: number;
  vehicleName: string;
  mode?: "business" | "personal"; // Mode d'utilisation (business ou personal)

  // Kilométrage
  totalKm: number; // Km totaux prévus ou réels pour l'année (tous usages)
  businessKm: number; // Km d'affaires cumulés automatiquement depuis les journaux
  businessRatio: number; // businessKm / totalKm (0 si totalKm = 0)

  // Détail des coûts annuels fixes
  insuranceAnnual: number; // Assurance
  leaseFinanceAnnual: number; // Location / financement
  maintenanceAnnual: number; // Entretien / réparations
  fuelAnnual: number; // Carburant estimé annuel
  registrationAnnual: number; // Immatriculation / permis
  otherAnnual: number; // Autres coûts fixes liés au véhicule

  // Total des coûts annuels fixes (somme des 6 ci-dessus)
  annualFixedCosts: number;

  // Petites dépenses directes (parking, etc.) cumulées depuis le journal
  variableParkingAndOther: number;

  // Résultat fiscal global
  deductibleTotal: number;

  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleJournalEntry {
  id: string;
  userId: string;

  year: number;
  vehicleProfileId: string; // Référence au profil annuel
  vehicleName: string; // Dénormalisé pour affichage
  mode?: "business" | "personal"; // Mode d'utilisation (business ou personal)

  periodStart: string; // "YYYY-MM-DD"
  periodEnd: string; // "YYYY-MM-DD"

  businessKm: number; // Km d'affaires pour cette période

  periodTotal: number; // Dépenses totales de la période (parking + autres)
  parking: number; // Stationnement / péages pour cette période
  other: number; // Autres petites dépenses liées au travail

  createdAt?: string;
  updatedAt?: string;
}

/**
 * Récalcule les agrégats (km d'affaires + parking/autres) pour un profil annuel
 * à partir de tous les journaux associés, puis met à jour le profil.
 */
async function recomputeVehicleAnnualProfileFromJournals(
  userId: string,
  year: number,
  vehicleProfileId: string
): Promise<void> {
  if (!db) return;

  const profileRef = doc(db, "vehicleAnnualProfiles", vehicleProfileId);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    console.warn("Profil annuel véhicule introuvable pour recompute:", vehicleProfileId);
    return;
  }

  const profileData = profileSnap.data() as VehicleAnnualProfile;
  const profileMode = profileData.mode || getCurrentMode();

  const journalsRef = collection(db, "vehicleJournals");
  const q = query(
    journalsRef,
    where("userId", "==", userId),
    where("year", "==", year),
    where("vehicleProfileId", "==", vehicleProfileId),
    where("mode", "==", profileMode)
  );

  const snapshot = await getDocs(q);

  let totalBusinessKm = 0;
  let totalParkingAndOther = 0;

  snapshot.forEach((d) => {
    const data = d.data() as VehicleJournalEntry;
    totalBusinessKm += data.businessKm || 0;
    totalParkingAndOther += (data.parking || 0) + (data.other || 0);
  });

  const totalKm = profileData.totalKm || 0;
  const businessRatio =
    totalKm > 0 ? Math.min(1, Math.max(0, totalBusinessKm / totalKm)) : 0;

  const annualFixedCosts = profileData.annualFixedCosts || 0;
  const variableParkingAndOther = totalParkingAndOther;
  const deductibleTotal = annualFixedCosts * businessRatio + variableParkingAndOther;

  const updated: Partial<VehicleAnnualProfile> = {
    businessKm: totalBusinessKm,
    businessRatio,
    variableParkingAndOther,
    deductibleTotal,
    updatedAt: new Date().toISOString(),
  };

  await updateDoc(profileRef, updated as any);

  window.dispatchEvent(new Event("vehicleAnnualProfileUpdated"));
}

/**
 * Récupère tous les profils annuels véhicule pour une année donnée
 */
export async function getVehicleAnnualProfiles(
  year: number,
  mode?: "business" | "personal"
): Promise<VehicleAnnualProfile[]> {
  if (!db) {
    console.warn("❌ Firestore non initialisé");
    return [];
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn("❌ Utilisateur non authentifié");
      return [];
    }

    const currentMode = mode || getCurrentMode();

    const profilesRef = collection(db, "vehicleAnnualProfiles");
    const q = query(
      profilesRef,
      where("userId", "==", userId),
      where("year", "==", year),
      where("mode", "==", currentMode)
    );

    const snapshot = await getDocs(q);
    const profiles: VehicleAnnualProfile[] = [];

    snapshot.forEach((d) => {
      const data = d.data() as VehicleAnnualProfile;
      if (data.mode === currentMode) {
        profiles.push(data);
      }
    });

    return profiles.sort((a, b) => a.vehicleName.localeCompare(b.vehicleName));
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des profils annuels véhicule:", error);
    return [];
  }
}

/**
 * Crée ou met à jour un profil annuel pour un véhicule donné (par année)
 */
export async function upsertVehicleAnnualProfile(
  year: number,
  data: {
    id?: string;
    vehicleName: string;
    totalKm: number;
    insuranceAnnual: number;
    leaseFinanceAnnual: number;
    maintenanceAnnual: number;
    fuelAnnual: number;
    registrationAnnual: number;
    otherAnnual: number;
    mode?: "business" | "personal";
  }
): Promise<string | null> {
  if (!db) {
    console.warn("❌ Firestore non initialisé");
    return null;
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("❌ Utilisateur non authentifié");
      return null;
    }

    const id = data.id || nanoid();
    const profileRef = doc(db, "vehicleAnnualProfiles", id);
    const now = new Date().toISOString();

    const existingSnap = await getDoc(profileRef);
    let existing: Partial<VehicleAnnualProfile> = {};
    if (existingSnap.exists()) {
      existing = existingSnap.data() as VehicleAnnualProfile;
    }

    const totalKm = data.totalKm || 0;
    const businessKm = existing.businessKm || 0;
    const businessRatio =
      totalKm > 0 ? Math.min(1, Math.max(0, businessKm / totalKm)) : 0;

    const insuranceAnnual = data.insuranceAnnual || 0;
    const leaseFinanceAnnual = data.leaseFinanceAnnual || 0;
    const maintenanceAnnual = data.maintenanceAnnual || 0;
    const fuelAnnual = data.fuelAnnual || 0;
    const registrationAnnual = data.registrationAnnual || 0;
    const otherAnnual = data.otherAnnual || 0;

    const annualFixedCosts =
      insuranceAnnual +
      leaseFinanceAnnual +
      maintenanceAnnual +
      fuelAnnual +
      registrationAnnual +
      otherAnnual;

    const variableParkingAndOther = existing.variableParkingAndOther || 0;
    const deductibleTotal =
      annualFixedCosts * businessRatio + variableParkingAndOther;

    const currentMode = data.mode || getCurrentMode();

    const profile: VehicleAnnualProfile = {
      id,
      userId,
      year,
      vehicleName: data.vehicleName,
      totalKm,
      businessKm,
      businessRatio,
      insuranceAnnual,
      leaseFinanceAnnual,
      maintenanceAnnual,
      fuelAnnual,
      registrationAnnual,
      otherAnnual,
      annualFixedCosts,
      variableParkingAndOther,
      deductibleTotal,
      mode: currentMode,
      createdAt: existing.createdAt || now,
      updatedAt: now,
    };

    console.log("💾 Enregistrement du profil annuel véhicule:", {
      id,
      vehicleName: data.vehicleName,
      year,
      annualFixedCosts,
      path: `vehicleAnnualProfiles/${id}`,
    });

    await setDoc(profileRef, profile);
    console.log("✅ Profil annuel véhicule enregistré avec succès");

    // Vérifier que le profil a bien été enregistré
    try {
      const verifyRef = doc(db, "vehicleAnnualProfiles", id);
      const verifyDoc = await getDoc(verifyRef);
      if (verifyDoc.exists()) {
        console.log("✅ Profil vérifié et confirmé dans Firestore");
      } else {
        console.warn("⚠️ Profil créé mais pas encore visible (synchronisation en cours)");
      }
    } catch (verifyError: any) {
      console.warn(
        "⚠️ Impossible de vérifier le profil:",
        verifyError?.code,
        verifyError?.message
      );
    }

    window.dispatchEvent(new Event("vehicleAnnualProfileUpdated"));
    return id;
  } catch (error: any) {
    console.error(
      "❌ Erreur lors de la création/mise à jour du profil annuel véhicule:",
      error
    );
    console.error("❌ Code d'erreur:", error?.code);
    console.error("❌ Message:", error?.message);
    if (error?.code === "permission-denied") {
      console.error("❌ Permission refusée - Vérifiez les règles Firestore");
      console.error(
        "❌ Assurez-vous que les règles permettent la création pour vehicleAnnualProfiles/{profileId}"
      );
    }
    return null;
  }
}

/**
 * Supprime un profil annuel véhicule
 */
export async function deleteVehicleAnnualProfile(
  profileId: string
): Promise<boolean> {
  if (!db) {
    console.warn("❌ Firestore non initialisé");
    return false;
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("❌ Utilisateur non authentifié");
      return false;
    }

    const profileRef = doc(db, "vehicleAnnualProfiles", profileId);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      console.error("❌ Profil annuel véhicule non trouvé");
      return false;
    }

    const profileData = profileSnap.data() as VehicleAnnualProfile;
    if (profileData.userId !== userId) {
      console.error("❌ Accès refusé au profil annuel véhicule");
      return false;
    }

    await deleteDoc(profileRef);
    window.dispatchEvent(new Event("vehicleAnnualProfileUpdated"));

    // Option : supprimer aussi les journaux liés (à implémenter au besoin)

    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du profil annuel véhicule:", error);
    return false;
  }
}

/**
 * Récupère les journaux de déplacements pour une année donnée
 */
export async function getVehicleJournals(
  year: number,
  mode?: "business" | "personal"
): Promise<VehicleJournalEntry[]> {
  if (!db) {
    console.warn("❌ Firestore non initialisé");
    return [];
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn("❌ Utilisateur non authentifié");
      return [];
    }

    const currentMode = mode || getCurrentMode();

    const journalsRef = collection(db, "vehicleJournals");
    const q = query(
      journalsRef,
      where("userId", "==", userId),
      where("year", "==", year),
      where("mode", "==", currentMode)
    );

    const snapshot = await getDocs(q);
    const entries: VehicleJournalEntry[] = [];

    snapshot.forEach((d) => {
      const data = d.data() as VehicleJournalEntry;
      if (data.mode === currentMode) {
        entries.push(data);
      }
    });

    return entries.sort((a, b) => b.periodStart.localeCompare(a.periodStart));
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des journaux véhicule:",
      error
    );
    return [];
  }
}

/**
 * Ajoute une entrée de journal de déplacement et met à jour le profil annuel associé
 */
export async function addVehicleJournalEntry(
  entry: Omit<VehicleJournalEntry, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string | null> {
  if (!db) {
    console.warn("❌ Firestore non initialisé");
    return null;
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("❌ Utilisateur non authentifié");
      return null;
    }

    const id = nanoid();
    const now = new Date().toISOString();
    const currentMode = entry.mode || getCurrentMode();

    const data: VehicleJournalEntry = {
      id,
      userId,
      ...entry,
      mode: currentMode,
      createdAt: now,
      updatedAt: now,
    };

    const journalRef = doc(db, "vehicleJournals", id);
    await setDoc(journalRef, data);

    await recomputeVehicleAnnualProfileFromJournals(
      userId,
      entry.year,
      entry.vehicleProfileId
    );

    window.dispatchEvent(new Event("vehicleJournalsUpdated"));
    return id;
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout d'un journal véhicule:", error);
    return null;
  }
}

/**
 * Met à jour un journal de déplacement et recalcule le profil annuel associé
 */
export async function updateVehicleJournalEntry(
  journalId: string,
  updates: Partial<Omit<VehicleJournalEntry, "id" | "userId">>
): Promise<boolean> {
  if (!db) {
    console.warn("❌ Firestore non initialisé");
    return false;
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("❌ Utilisateur non authentifié");
      return false;
    }

    const journalRef = doc(db, "vehicleJournals", journalId);
    const journalSnap = await getDoc(journalRef);

    if (!journalSnap.exists()) {
      console.error("❌ Journal véhicule non trouvé");
      return false;
    }

    const existing = journalSnap.data() as VehicleJournalEntry;
    if (existing.userId !== userId) {
      console.error("❌ Accès refusé au journal véhicule");
      return false;
    }

    const updated: Partial<VehicleJournalEntry> = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(journalRef, updated as any);

    const year = updates.year ?? existing.year;
    const vehicleProfileId = updates.vehicleProfileId ?? existing.vehicleProfileId;

    await recomputeVehicleAnnualProfileFromJournals(
      userId,
      year,
      vehicleProfileId
    );

    window.dispatchEvent(new Event("vehicleJournalsUpdated"));
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du journal véhicule:", error);
    return false;
  }
}

/**
 * Supprime un journal de déplacement et recalcule le profil annuel associé
 */
export async function deleteVehicleJournalEntry(
  journalId: string
): Promise<boolean> {
  if (!db) {
    console.warn("❌ Firestore non initialisé");
    return false;
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("❌ Utilisateur non authentifié");
      return false;
    }

    const journalRef = doc(db, "vehicleJournals", journalId);
    const journalSnap = await getDoc(journalRef);

    if (!journalSnap.exists()) {
      console.error("❌ Journal véhicule non trouvé");
      return false;
    }

    const existing = journalSnap.data() as VehicleJournalEntry;
    if (existing.userId !== userId) {
      console.error("❌ Accès refusé au journal véhicule");
      return false;
    }

    await deleteDoc(journalRef);

    await recomputeVehicleAnnualProfileFromJournals(
      userId,
      existing.year,
      existing.vehicleProfileId
    );

    window.dispatchEvent(new Event("vehicleJournalsUpdated"));
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du journal véhicule:", error);
    return false;
  }
}

// ==================== BUREAU À DOMICILE ====================

export interface HomeOfficeExpense {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  totalArea: number;
  officeArea: number;
  businessAreaRatio: number;
  rent: number;
  electricityHeating: number;
  condoFees: number;
  propertyTaxes: number;
  homeInsurance: number;
  other: number;
  totalExpenses: number;
  deductibleTotal: number;
  mode?: "business" | "personal"; // Mode d'utilisation (business ou personal)
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Récupère les dépenses bureau à domicile pour une année donnée
 */
export async function getHomeOfficeExpenses(
  year: number,
  mode?: "business" | "personal"
): Promise<HomeOfficeExpense[]> {
  if (!db) {
    console.warn("❌ Firestore non initialisé");
    return [];
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn("❌ Utilisateur non authentifié");
      return [];
    }

    const currentMode = mode || getCurrentMode();
    const startDate = new Date(year, 0, 1).toISOString().split("T")[0];
    const endDate = new Date(year, 11, 31).toISOString().split("T")[0];

    const expensesRef = collection(db, "homeOfficeExpenses");
    const q = query(
      expensesRef,
      where("userId", "==", userId),
      where("mode", "==", currentMode)
    );

    const snapshot = await getDocs(q);
    const expenses: HomeOfficeExpense[] = [];

    snapshot.forEach((d) => {
      const data = d.data();
      if (data.periodStart >= startDate && data.periodEnd <= endDate && data.mode === currentMode) {
        expenses.push({
          id: d.id,
          ...data,
        } as HomeOfficeExpense);
      }
    });

    return expenses.sort((a, b) => b.periodStart.localeCompare(a.periodStart));
  } catch (error: any) {
    console.error(
      "❌ Erreur lors de la récupération des dépenses bureau à domicile:",
      error
    );
    return [];
  }
}

// ==================== DÉPENSES TECHNO ====================

export interface TechExpense {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  hardwareSmallEquipment: number;
  hardwareCapitalAssets: number;
  softwareLicenses: number;
  saasSubscriptions: number;
  internetTotal: number;
  internetBusinessRatio: number;
  phoneTotal: number;
  phoneBusinessRatio: number;
  otherTech: number;
  totalExpenses: number;
  deductibleTotal: number;
  capitalizableHardware: number;
  mode?: "business" | "personal"; // Mode d'utilisation (business ou personal)
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Récupère les dépenses techno pour une année donnée
 */
export async function getTechExpenses(
  year: number,
  mode?: "business" | "personal"
): Promise<TechExpense[]> {
  if (!db) {
    console.warn("❌ Firestore non initialisé");
    return [];
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn("❌ Utilisateur non authentifié");
      return [];
    }

    const currentMode = mode || getCurrentMode();
    const startDate = new Date(year, 0, 1).toISOString().split("T")[0];
    const endDate = new Date(year, 11, 31).toISOString().split("T")[0];

    const expensesRef = collection(db, "techExpenses");
    const q = query(
      expensesRef,
      where("userId", "==", userId),
      where("mode", "==", currentMode)
    );

    const snapshot = await getDocs(q);
    const expenses: TechExpense[] = [];

    snapshot.forEach((d) => {
      const data = d.data();
      if (data.periodStart >= startDate && data.periodEnd <= endDate && data.mode === currentMode) {
        expenses.push({
          id: d.id,
          ...data,
        } as TechExpense);
      }
    });

    return expenses.sort((a, b) => b.periodStart.localeCompare(a.periodStart));
  } catch (error: any) {
    console.error(
      "❌ Erreur lors de la récupération des dépenses techno:",
      error
    );
    return [];
  }
}
