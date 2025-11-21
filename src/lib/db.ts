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
  type: "income" | "expense" | "depense" | "transfert" | "remboursement" | "paiement_facture" | "revenue";
  company?: string; // Pour mode business
  account?: string; // Pour mode personal (nom du compte)
  accountTo?: string; // Pour transfert entre comptes (compte de destination)
  transferType?: "between_accounts" | "between_persons"; // Type de transfert
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
 * Convertit le mode en nom de collection française
 */
function getModeCollectionName(mode: "business" | "personal"): "entreprise" | "personnelle" {
  return mode === "business" ? "entreprise" : "personnelle";
}

/**
 * Obtient la référence de collection basée sur userId et mode
 * Structure: Users/{userId}/data/{mode}/{collection} (5 segments = collection valide)
 */
function getCollectionRef(collectionName: string, userId: string, mode: "business" | "personal") {
  const modeName = getModeCollectionName(mode);
  // Structure: Users/{userId}/data/{mode}/{collection} = 5 segments (impair) = collection valide
  return collection(db, "Users", userId, "data", modeName, collectionName);
}

/**
 * Obtient la référence de document basée sur userId et mode
 * Structure: Users/{userId}/data/{mode}/{collection}/{docId} (6 segments = document valide)
 */
function getDocRef(collectionName: string, userId: string, mode: "business" | "personal", docId: string) {
  const modeName = getModeCollectionName(mode);
  // Structure: Users/{userId}/data/{mode}/{collection}/{docId} = 6 segments (pair) = document valide
  return doc(db, "Users", userId, "data", modeName, collectionName, docId);
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

    // Utiliser la nouvelle structure: Users/{userId}/{mode}/transactions
    const transactionsRef = getCollectionRef("transactions", userId, currentMode);
    let allDocs: any[] = [];
    
    try {
      // Récupérer les transactions de la sous-collection avec tri par date
      const q = query(
        transactionsRef,
        orderBy("date", "desc")
      );
      const snapshot = await getDocs(q);
      // Filtrer le document d'initialisation
      allDocs = snapshot.docs.filter(doc => doc.id !== "__init__" && !doc.data()._initialized);
      console.log("📊 Transactions trouvées dans sous-collection:", allDocs.length);
    } catch (orderByError: any) {
      console.warn("⚠️ Erreur avec orderBy, récupération sans tri:", orderByError?.code);
      if (orderByError?.code === "failed-precondition") {
        console.warn("⚠️ Index Firestore manquant. Récupération sans orderBy…");
        console.warn(
          "💡 Créez un index composite sur: collection=Users/{userId}/{mode}/transactions, fields=date (Descending)"
        );
      }
          const q = query(transactionsRef);
          const snapshot = await getDocs(q);
          // Filtrer le document d'initialisation
          allDocs = snapshot.docs.filter(doc => doc.id !== "__init__" && !doc.data()._initialized);
          console.log("📊 Transactions trouvées (sans orderBy):", allDocs.length);
    }

    console.log("📊 Nombre total de documents récupérés:", allDocs.length);

    const transactions: Transaction[] = [];

    allDocs.forEach((d) => {
      const data = d.data() as any;
      console.log("📄 Transaction trouvée:", d.id, "Date:", data.date);
      
      // Vérifier que la transaction est dans la période
      if (data.date >= startDate && data.date <= endDate) {
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
    
    if (allDocs.length > 0 && transactions.length === 0) {
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

    // Utiliser la nouvelle structure: Users/{userId}/{mode}/transactions
    const transactionRef = getDocRef("transactions", userId, currentMode, id);
    const pathString = `Users/${userId}/data/${getModeCollectionName(currentMode)}/transactions/${id}`;
    console.log("🔄 Chemin du document:", pathString);
    console.log("🔄 Exécution de setDoc()…");

    await setDoc(transactionRef, transactionData);
    console.log("✅ Transaction créée avec succès dans Firestore");

    try {
      const verifyRef = getDocRef("transactions", userId, currentMode, id);
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

    // Chercher la transaction dans les deux sous-collections (personnelle et entreprise)
    let transactionDoc: any = null;
    let transactionRef: any = null;

    for (const mode of ["business", "personal"] as const) {
      const ref = getDocRef("transactions", userId, mode, transactionId);
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) {
        transactionDoc = docSnap;
        transactionRef = ref;
        break;
      }
    }

    if (!transactionDoc || !transactionRef) {
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

    // Chercher la transaction dans les deux sous-collections (personnelle et entreprise)
    let transactionDoc: any = null;
    let transactionRef: any = null;

    for (const mode of ["business", "personal"] as const) {
      const ref = getDocRef("transactions", userId, mode, transactionId);
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) {
        transactionDoc = docSnap;
        transactionRef = ref;
        break;
      }
    }

    if (!transactionDoc || !transactionRef) {
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
  vehicleProfileId: string,
  mode: "business" | "personal"
): Promise<void> {
  if (!db) return;

  // Utiliser la nouvelle structure: Users/{userId}/{mode}/vehicleAnnualProfiles
  const profileRef = getDocRef("vehicleAnnualProfiles", userId, mode, vehicleProfileId);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    console.warn("Profil annuel véhicule introuvable pour recompute:", vehicleProfileId);
    return;
  }

  const profileData = profileSnap.data() as VehicleAnnualProfile;

  // Utiliser la nouvelle structure: Users/{userId}/{mode}/vehicleJournals
  const journalsRef = getCollectionRef("vehicleJournals", userId, mode);
  const q = query(
    journalsRef,
    where("year", "==", year),
    where("vehicleProfileId", "==", vehicleProfileId)
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

    // Utiliser la nouvelle structure: Users/{userId}/{mode}/vehicleAnnualProfiles
    const profilesRef = getCollectionRef("vehicleAnnualProfiles", userId, currentMode);
    const q = query(
      profilesRef,
      where("year", "==", year)
    );

    const snapshot = await getDocs(q);
    const profiles: VehicleAnnualProfile[] = [];

    snapshot.forEach((d) => {
      const data = d.data() as VehicleAnnualProfile;
      profiles.push({
        id: d.id,
        ...data,
      });
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
    const currentMode = data.mode || getCurrentMode();
    
    // Utiliser la nouvelle structure: Users/{userId}/{mode}/vehicleAnnualProfiles
    const profileRef = getDocRef("vehicleAnnualProfiles", userId, currentMode, id);
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
      path: `Users/${userId}/data/${getModeCollectionName(currentMode)}/vehicleAnnualProfiles/${id}`,
    });

    await setDoc(profileRef, profile);
    console.log("✅ Profil annuel véhicule enregistré avec succès");

    // Vérifier que le profil a bien été enregistré
    try {
      const verifyRef = getDocRef("vehicleAnnualProfiles", userId, currentMode, id);
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

    // Chercher le profil dans les deux sous-collections (personnelle et entreprise)
    let profileSnap: any = null;
    let profileRef: any = null;

    for (const mode of ["business", "personal"] as const) {
      const ref = getDocRef("vehicleAnnualProfiles", userId, mode, profileId);
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) {
        profileSnap = docSnap;
        profileRef = ref;
        break;
      }
    }

    if (!profileSnap || !profileRef) {
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

    // Utiliser la nouvelle structure: Users/{userId}/{mode}/vehicleJournals
    const journalsRef = getCollectionRef("vehicleJournals", userId, currentMode);
    const q = query(
      journalsRef,
      where("year", "==", year)
    );

    const snapshot = await getDocs(q);
    const entries: VehicleJournalEntry[] = [];

    snapshot.forEach((d) => {
      const data = d.data() as VehicleJournalEntry;
      entries.push({
        id: d.id,
        ...data,
      });
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

    // Utiliser la nouvelle structure: Users/{userId}/{mode}/vehicleJournals
    const journalRef = getDocRef("vehicleJournals", userId, currentMode, id);
    await setDoc(journalRef, data);

    await recomputeVehicleAnnualProfileFromJournals(
      userId,
      entry.year,
      entry.vehicleProfileId,
      currentMode
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

    // Chercher le journal dans les deux sous-collections (personnelle et entreprise)
    let journalSnap: any = null;
    let journalRef: any = null;
    let foundMode: "business" | "personal" | null = null;

    for (const mode of ["business", "personal"] as const) {
      const ref = getDocRef("vehicleJournals", userId, mode, journalId);
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) {
        journalSnap = docSnap;
        journalRef = ref;
        foundMode = mode;
        break;
      }
    }

    if (!journalSnap || !journalRef || !foundMode) {
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
      vehicleProfileId,
      foundMode
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

    // Chercher le journal dans les deux sous-collections (personnelle et entreprise)
    let journalSnap: any = null;
    let journalRef: any = null;
    let foundMode: "business" | "personal" | null = null;

    for (const mode of ["business", "personal"] as const) {
      const ref = getDocRef("vehicleJournals", userId, mode, journalId);
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) {
        journalSnap = docSnap;
        journalRef = ref;
        foundMode = mode;
        break;
      }
    }

    if (!journalSnap || !journalRef || !foundMode) {
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
      existing.vehicleProfileId,
      foundMode
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

    // Utiliser la nouvelle structure: Users/{userId}/{mode}/homeOfficeExpenses
    const expensesRef = getCollectionRef("homeOfficeExpenses", userId, currentMode);
    const q = query(expensesRef);

    const snapshot = await getDocs(q);
    const expenses: HomeOfficeExpense[] = [];

    snapshot.forEach((d) => {
      const data = d.data();
      if (data.periodStart >= startDate && data.periodEnd <= endDate) {
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

    // Utiliser la nouvelle structure: Users/{userId}/{mode}/techExpenses
    const expensesRef = getCollectionRef("techExpenses", userId, currentMode);
    const q = query(expensesRef);

    const snapshot = await getDocs(q);
    const expenses: TechExpense[] = [];

    snapshot.forEach((d) => {
      const data = d.data();
      if (data.periodStart >= startDate && data.periodEnd <= endDate) {
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

// ==================== MIGRATION DES DONNÉES ====================

export interface MigrationResult {
  success: boolean;
  collections: {
    transactions: { migrated: number; errors: number };
    vehicleAnnualProfiles: { migrated: number; errors: number };
    vehicleJournals: { migrated: number; errors: number };
    homeOfficeExpenses: { migrated: number; errors: number };
    techExpenses: { migrated: number; errors: number };
  };
  errors: string[];
}

/**
 * Migre toutes les données existantes vers la nouvelle structure Users/{userId}/{mode}
 * Cette fonction lit les données des anciennes collections et les réorganise dans les nouvelles sous-collections
 */
export async function migrateDataToNewStructure(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    collections: {
      transactions: { migrated: 0, errors: 0 },
      vehicleAnnualProfiles: { migrated: 0, errors: 0 },
      vehicleJournals: { migrated: 0, errors: 0 },
      homeOfficeExpenses: { migrated: 0, errors: 0 },
      techExpenses: { migrated: 0, errors: 0 },
    },
    errors: [],
  };

  if (!db) {
    result.success = false;
    result.errors.push("❌ Firestore non initialisé");
    return result;
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      result.success = false;
      result.errors.push("❌ Utilisateur non authentifié");
      return result;
    }

    console.log("🚀 Début de la migration des données pour l'utilisateur:", userId);

    // ========== MIGRATION DES TRANSACTIONS ==========
    try {
      console.log("📦 Migration des transactions...");
      
      // Chercher dans la collection racine
      const oldTransactionsRef = collection(db, "transactions");
      const transactionsQuery = query(
        oldTransactionsRef,
        where("userId", "==", userId)
      );
      let transactionsSnapshot = await getDocs(transactionsQuery);
      
      console.log(`📊 ${transactionsSnapshot.size} transaction(s) trouvée(s) dans la collection racine`);
      
      // Si aucune trouvée, chercher aussi dans users/{userId}/transactions
      if (transactionsSnapshot.empty) {
        try {
          const usersTransactionsRef = collection(db, "users", userId, "transactions");
          transactionsSnapshot = await getDocs(usersTransactionsRef);
          console.log(`📊 ${transactionsSnapshot.size} transaction(s) trouvée(s) dans users/${userId}/transactions`);
        } catch (error: any) {
          console.log("ℹ️ Aucune transaction dans users/{userId}/transactions");
        }
      }

      if (transactionsSnapshot.empty) {
        console.log("ℹ️ Aucune transaction à migrer");
      }

      for (const docSnap of transactionsSnapshot.docs) {
        try {
          const data = docSnap.data() as Transaction;
          const mode = data.mode || "business"; // Par défaut "business" pour les anciennes données
          console.log(`🔄 Migration transaction ${docSnap.id} (mode: ${mode})...`);
          
          const newRef = getDocRef("transactions", userId, mode, docSnap.id);
          console.log(`📍 Nouveau chemin: Users/${userId}/data/${getModeCollectionName(mode)}/transactions/${docSnap.id}`);
          
          // Vérifier si la transaction existe déjà dans la nouvelle structure
          const existingDoc = await getDoc(newRef);
          if (!existingDoc.exists()) {
            // S'assurer que l'ID est inclus dans les données
            const dataWithId = { ...data, id: docSnap.id };
            await setDoc(newRef, dataWithId);
            result.collections.transactions.migrated++;
            console.log(`✅ Transaction ${docSnap.id} migrée vers ${mode}`);
          } else {
            console.log(`⏭️ Transaction ${docSnap.id} déjà migrée`);
          }
        } catch (error: any) {
          result.collections.transactions.errors++;
          const errorMsg = `Erreur migration transaction ${docSnap.id}: ${error.message || error.code || error}`;
          result.errors.push(errorMsg);
          console.error(`❌ Erreur migration transaction ${docSnap.id}:`, error);
          console.error(`❌ Code:`, error?.code);
          console.error(`❌ Message:`, error?.message);
        }
      }
      console.log(`✅ Transactions: ${result.collections.transactions.migrated} migrées, ${result.collections.transactions.errors} erreurs`);
    } catch (error: any) {
      result.success = false;
      const errorMsg = `Erreur lors de la migration des transactions: ${error.message || error.code || error}`;
      result.errors.push(errorMsg);
      console.error("❌ Erreur lors de la migration des transactions:", error);
      console.error("❌ Code:", error?.code);
      console.error("❌ Message:", error?.message);
    }

    // ========== MIGRATION DES VEHICLE ANNUAL PROFILES ==========
    try {
      console.log("📦 Migration des profils annuels véhicule...");
      const oldProfilesRef = collection(db, "vehicleAnnualProfiles");
      const profilesQuery = query(
        oldProfilesRef,
        where("userId", "==", userId)
      );
      let profilesSnapshot = await getDocs(profilesQuery);
      
      console.log(`📊 ${profilesSnapshot.size} profil(s) trouvé(s) dans la collection racine`);
      
      if (profilesSnapshot.empty) {
        try {
          const usersProfilesRef = collection(db, "users", userId, "vehicleAnnualProfiles");
          profilesSnapshot = await getDocs(usersProfilesRef);
          console.log(`📊 ${profilesSnapshot.size} profil(s) trouvé(s) dans users/${userId}/vehicleAnnualProfiles`);
        } catch (error: any) {
          console.log("ℹ️ Aucun profil dans users/{userId}/vehicleAnnualProfiles");
        }
      }

      for (const docSnap of profilesSnapshot.docs) {
        try {
          const data = docSnap.data() as VehicleAnnualProfile;
          const mode = data.mode || "business";
          const newRef = getDocRef("vehicleAnnualProfiles", userId, mode, docSnap.id);
          
          const existingDoc = await getDoc(newRef);
          if (!existingDoc.exists()) {
            const dataWithId = { ...data, id: docSnap.id };
            await setDoc(newRef, dataWithId);
            result.collections.vehicleAnnualProfiles.migrated++;
            console.log(`✅ Profil véhicule ${docSnap.id} migré vers ${mode}`);
          } else {
            console.log(`⏭️ Profil véhicule ${docSnap.id} déjà migré`);
          }
        } catch (error: any) {
          result.collections.vehicleAnnualProfiles.errors++;
          result.errors.push(`Erreur migration profil véhicule ${docSnap.id}: ${error.message || error.code || error}`);
          console.error(`❌ Erreur migration profil véhicule ${docSnap.id}:`, error);
        }
      }
      console.log(`✅ Profils véhicule: ${result.collections.vehicleAnnualProfiles.migrated} migrés, ${result.collections.vehicleAnnualProfiles.errors} erreurs`);
    } catch (error: any) {
      result.success = false;
      result.errors.push(`Erreur lors de la migration des profils véhicule: ${error.message || error.code || error}`);
      console.error("❌ Erreur lors de la migration des profils véhicule:", error);
    }

    // ========== MIGRATION DES VEHICLE JOURNALS ==========
    try {
      console.log("📦 Migration des journaux véhicule...");
      const oldJournalsRef = collection(db, "vehicleJournals");
      const journalsQuery = query(
        oldJournalsRef,
        where("userId", "==", userId)
      );
      let journalsSnapshot = await getDocs(journalsQuery);
      
      console.log(`📊 ${journalsSnapshot.size} journal(aux) trouvé(s) dans la collection racine`);
      
      if (journalsSnapshot.empty) {
        try {
          const usersJournalsRef = collection(db, "users", userId, "vehicleJournals");
          journalsSnapshot = await getDocs(usersJournalsRef);
          console.log(`📊 ${journalsSnapshot.size} journal(aux) trouvé(s) dans users/${userId}/vehicleJournals`);
        } catch (error: any) {
          console.log("ℹ️ Aucun journal dans users/{userId}/vehicleJournals");
        }
      }

      for (const docSnap of journalsSnapshot.docs) {
        try {
          const data = docSnap.data() as VehicleJournalEntry;
          const mode = data.mode || "business";
          const newRef = getDocRef("vehicleJournals", userId, mode, docSnap.id);
          
          const existingDoc = await getDoc(newRef);
          if (!existingDoc.exists()) {
            const dataWithId = { ...data, id: docSnap.id };
            await setDoc(newRef, dataWithId);
            result.collections.vehicleJournals.migrated++;
            console.log(`✅ Journal véhicule ${docSnap.id} migré vers ${mode}`);
          } else {
            console.log(`⏭️ Journal véhicule ${docSnap.id} déjà migré`);
          }
        } catch (error: any) {
          result.collections.vehicleJournals.errors++;
          result.errors.push(`Erreur migration journal véhicule ${docSnap.id}: ${error.message || error.code || error}`);
          console.error(`❌ Erreur migration journal véhicule ${docSnap.id}:`, error);
        }
      }
      console.log(`✅ Journaux véhicule: ${result.collections.vehicleJournals.migrated} migrés, ${result.collections.vehicleJournals.errors} erreurs`);
    } catch (error: any) {
      result.success = false;
      result.errors.push(`Erreur lors de la migration des journaux véhicule: ${error.message || error.code || error}`);
      console.error("❌ Erreur lors de la migration des journaux véhicule:", error);
    }

    // ========== MIGRATION DES HOME OFFICE EXPENSES ==========
    try {
      console.log("📦 Migration des dépenses bureau à domicile...");
      const oldExpensesRef = collection(db, "homeOfficeExpenses");
      const expensesQuery = query(
        oldExpensesRef,
        where("userId", "==", userId)
      );
      let expensesSnapshot = await getDocs(expensesQuery);
      
      console.log(`📊 ${expensesSnapshot.size} dépense(s) bureau trouvée(s) dans la collection racine`);
      
      if (expensesSnapshot.empty) {
        try {
          const usersExpensesRef = collection(db, "users", userId, "homeOfficeExpenses");
          expensesSnapshot = await getDocs(usersExpensesRef);
          console.log(`📊 ${expensesSnapshot.size} dépense(s) bureau trouvée(s) dans users/${userId}/homeOfficeExpenses`);
        } catch (error: any) {
          console.log("ℹ️ Aucune dépense bureau dans users/{userId}/homeOfficeExpenses");
        }
      }

      for (const docSnap of expensesSnapshot.docs) {
        try {
          const data = docSnap.data() as HomeOfficeExpense;
          const mode = data.mode || "business";
          const newRef = getDocRef("homeOfficeExpenses", userId, mode, docSnap.id);
          
          const existingDoc = await getDoc(newRef);
          if (!existingDoc.exists()) {
            const dataWithId = { ...data, id: docSnap.id };
            await setDoc(newRef, dataWithId);
            result.collections.homeOfficeExpenses.migrated++;
            console.log(`✅ Dépense bureau ${docSnap.id} migrée vers ${mode}`);
          } else {
            console.log(`⏭️ Dépense bureau ${docSnap.id} déjà migrée`);
          }
        } catch (error: any) {
          result.collections.homeOfficeExpenses.errors++;
          result.errors.push(`Erreur migration dépense bureau ${docSnap.id}: ${error.message || error.code || error}`);
          console.error(`❌ Erreur migration dépense bureau ${docSnap.id}:`, error);
        }
      }
      console.log(`✅ Dépenses bureau: ${result.collections.homeOfficeExpenses.migrated} migrées, ${result.collections.homeOfficeExpenses.errors} erreurs`);
    } catch (error: any) {
      result.success = false;
      result.errors.push(`Erreur lors de la migration des dépenses bureau: ${error.message || error.code || error}`);
      console.error("❌ Erreur lors de la migration des dépenses bureau:", error);
    }

    // ========== MIGRATION DES TECH EXPENSES ==========
    try {
      console.log("📦 Migration des dépenses techno...");
      const oldTechRef = collection(db, "techExpenses");
      const techQuery = query(
        oldTechRef,
        where("userId", "==", userId)
      );
      let techSnapshot = await getDocs(techQuery);
      
      console.log(`📊 ${techSnapshot.size} dépense(s) techno trouvée(s) dans la collection racine`);
      
      if (techSnapshot.empty) {
        try {
          const usersTechRef = collection(db, "users", userId, "techExpenses");
          techSnapshot = await getDocs(usersTechRef);
          console.log(`📊 ${techSnapshot.size} dépense(s) techno trouvée(s) dans users/${userId}/techExpenses`);
        } catch (error: any) {
          console.log("ℹ️ Aucune dépense techno dans users/{userId}/techExpenses");
        }
      }

      for (const docSnap of techSnapshot.docs) {
        try {
          const data = docSnap.data() as TechExpense;
          const mode = data.mode || "business";
          const newRef = getDocRef("techExpenses", userId, mode, docSnap.id);
          
          const existingDoc = await getDoc(newRef);
          if (!existingDoc.exists()) {
            const dataWithId = { ...data, id: docSnap.id };
            await setDoc(newRef, dataWithId);
            result.collections.techExpenses.migrated++;
            console.log(`✅ Dépense techno ${docSnap.id} migrée vers ${mode}`);
          } else {
            console.log(`⏭️ Dépense techno ${docSnap.id} déjà migrée`);
          }
        } catch (error: any) {
          result.collections.techExpenses.errors++;
          result.errors.push(`Erreur migration dépense techno ${docSnap.id}: ${error.message || error.code || error}`);
          console.error(`❌ Erreur migration dépense techno ${docSnap.id}:`, error);
        }
      }
      console.log(`✅ Dépenses techno: ${result.collections.techExpenses.migrated} migrées, ${result.collections.techExpenses.errors} erreurs`);
    } catch (error: any) {
      result.success = false;
      result.errors.push(`Erreur lors de la migration des dépenses techno: ${error.message || error.code || error}`);
      console.error("❌ Erreur lors de la migration des dépenses techno:", error);
    }

    const totalMigrated = 
      result.collections.transactions.migrated +
      result.collections.vehicleAnnualProfiles.migrated +
      result.collections.vehicleJournals.migrated +
      result.collections.homeOfficeExpenses.migrated +
      result.collections.techExpenses.migrated;

    const totalErrors = 
      result.collections.transactions.errors +
      result.collections.vehicleAnnualProfiles.errors +
      result.collections.vehicleJournals.errors +
      result.collections.homeOfficeExpenses.errors +
      result.collections.techExpenses.errors;

    console.log(`🎉 Migration terminée: ${totalMigrated} documents migrés, ${totalErrors} erreurs`);
    
    if (totalErrors > 0) {
      result.success = false;
    }

    return result;
  } catch (error: any) {
    result.success = false;
    result.errors.push(`Erreur générale de migration: ${error.message}`);
    console.error("❌ Erreur générale lors de la migration:", error);
    return result;
  }
}

/**
 * Inspecte la structure actuelle de Firestore pour voir où sont stockées les données
 */
export async function inspectFirestoreStructure(): Promise<{
  oldStructure: {
    transactions: number;
    vehicleAnnualProfiles: number;
    vehicleJournals: number;
    homeOfficeExpenses: number;
    techExpenses: number;
  };
  oldStructureUsers: {
    transactions: number;
    vehicleAnnualProfiles: number;
    vehicleJournals: number;
    homeOfficeExpenses: number;
    techExpenses: number;
  };
  newStructure: {
    personnelle: {
      transactions: number;
      vehicleAnnualProfiles: number;
      vehicleJournals: number;
      homeOfficeExpenses: number;
      techExpenses: number;
    };
    entreprise: {
      transactions: number;
      vehicleAnnualProfiles: number;
      vehicleJournals: number;
      homeOfficeExpenses: number;
      techExpenses: number;
    };
  };
}> {
  const result = {
    oldStructure: {
      transactions: 0,
      vehicleAnnualProfiles: 0,
      vehicleJournals: 0,
      homeOfficeExpenses: 0,
      techExpenses: 0,
    },
    oldStructureUsers: {
      transactions: 0,
      vehicleAnnualProfiles: 0,
      vehicleJournals: 0,
      homeOfficeExpenses: 0,
      techExpenses: 0,
    },
    newStructure: {
      personnelle: {
        transactions: 0,
        vehicleAnnualProfiles: 0,
        vehicleJournals: 0,
        homeOfficeExpenses: 0,
        techExpenses: 0,
      },
      entreprise: {
        transactions: 0,
        vehicleAnnualProfiles: 0,
        vehicleJournals: 0,
        homeOfficeExpenses: 0,
        techExpenses: 0,
      },
    },
  };

  if (!db) {
    console.warn("❌ Firestore non initialisé");
    return result;
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn("❌ Utilisateur non authentifié");
      return result;
    }

    console.log("🔍 Inspection de la structure Firestore pour l'utilisateur:", userId);

    // Vérifier l'ancienne structure (collections racine)
    const collections = [
      "transactions",
      "vehicleAnnualProfiles",
      "vehicleJournals",
      "homeOfficeExpenses",
      "techExpenses",
    ];

    for (const collectionName of collections) {
      try {
        // Vérifier dans la collection racine avec filtre userId
        const oldRef = collection(db, collectionName);
        const q = query(oldRef, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        (result.oldStructure as any)[collectionName] = snapshot.size;
        console.log(`📊 ${collectionName} (collection racine avec userId): ${snapshot.size} document(s)`);
        
        // Aussi vérifier sans filtre pour voir s'il y a des données
        try {
          const allSnapshot = await getDocs(oldRef);
          if (allSnapshot.size > 0) {
            console.log(`📊 ${collectionName} (collection racine totale): ${allSnapshot.size} document(s) (sans filtre userId)`);
            // Vérifier combien ont le bon userId
            let countWithUserId = 0;
            allSnapshot.forEach((doc) => {
              const data = doc.data();
              if (data.userId === userId) {
                countWithUserId++;
              }
            });
            if (countWithUserId !== snapshot.size) {
              console.log(`⚠️ ${collectionName}: ${countWithUserId} document(s) avec userId=${userId} trouvé(s) manuellement`);
            }
          }
        } catch (e) {
          // Ignorer les erreurs de lecture sans filtre
        }
      } catch (error: any) {
        console.warn(`⚠️ Erreur lors de l'inspection de ${collectionName}:`, error.message);
      }
    }
    
    // Vérifier aussi dans users/{userId}/... (minuscule)
    console.log("🔍 Vérification de la structure users/{userId}/... (minuscule)");
    for (const collectionName of collections) {
      try {
        const usersRef = collection(db, "users", userId, collectionName);
        const snapshot = await getDocs(usersRef);
        (result.oldStructureUsers as any)[collectionName] = snapshot.size;
        if (snapshot.size > 0) {
          console.log(`📊 ${collectionName} (users/${userId}/${collectionName}): ${snapshot.size} document(s)`);
        }
      } catch (error: any) {
        // Ignorer les erreurs si la structure n'existe pas
        console.log(`ℹ️ ${collectionName} (users/${userId}/${collectionName}): structure n'existe pas`);
      }
    }

    // Vérifier la nouvelle structure (Users/{userId}/data/{mode}/{collection})
    const modes = ["personnelle", "entreprise"] as const;

    for (const mode of modes) {
      for (const collectionName of collections) {
        try {
          const newRef = collection(db, "Users", userId, "data", mode, collectionName);
          const snapshot = await getDocs(newRef);
          (result.newStructure[mode] as any)[collectionName] = snapshot.size;
          console.log(`📊 ${collectionName} (${mode}): ${snapshot.size} document(s)`);
        } catch (error: any) {
          console.warn(`⚠️ Erreur lors de l'inspection de Users/${userId}/data/${mode}/${collectionName}:`, error.message);
        }
      }
    }

    console.log("✅ Inspection terminée");
    return result;
  } catch (error: any) {
    console.error("❌ Erreur lors de l'inspection:", error);
    return result;
  }
}
