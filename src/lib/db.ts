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

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  description?: string;
  category?: string;
  date: string;
  type: "income" | "expense";
  company?: string;
  tags?: string[];
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
 * Récupère les transactions pour une année donnée
 */
export async function getTransactions(year: number): Promise<Transaction[]> {
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

    // Calculer les dates de début et fin d'année
    const startDate = new Date(year, 0, 1).toISOString().split("T")[0];
    const endDate = new Date(year, 11, 31).toISOString().split("T")[0];

    console.log("📅 Période:", startDate, "à", endDate);

    const transactionsRef = collection(db, "transactions");

    // Essayer d'abord avec orderBy, si ça échoue, récupérer sans orderBy
    let snapshot;
    try {
      const q = query(
        transactionsRef,
        where("userId", "==", userId),
        orderBy("date", "desc")
      );
      snapshot = await getDocs(q);
    } catch (orderByError: any) {
      console.warn("⚠️ Erreur avec orderBy, récupération sans tri:", orderByError?.code);
      if (orderByError?.code === "failed-precondition") {
        console.warn("⚠️ Index Firestore manquant. Récupération sans orderBy...");
        console.warn(
          "💡 Créez un index composite sur: collection=transactions, fields=userId (Ascending), date (Descending)"
        );
      }
      // Récupérer sans orderBy et trier en mémoire
      const q = query(transactionsRef, where("userId", "==", userId));
      snapshot = await getDocs(q);
    }
    console.log("📊 Nombre total de documents récupérés:", snapshot.size);

    const transactions: Transaction[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      console.log("📄 Transaction trouvée:", docSnap.id, "Date:", data.date);
      // Filtrer par date en mémoire (plus simple que créer un index composite)
      if (data.date >= startDate && data.date <= endDate) {
        const transaction = {
          id: docSnap.id,
          ...data,
        } as Transaction;

        // Log des ITC si présents
        if (transaction.gstItc !== undefined && transaction.gstItc !== null) {
          console.log(
            "🔍 ITC GST trouvé dans transaction:",
            docSnap.id,
            "valeur:",
            transaction.gstItc
          );
        }
        if (transaction.qstItc !== undefined && transaction.qstItc !== null) {
          console.log(
            "🔍 ITC QST trouvé dans transaction:",
            docSnap.id,
            "valeur:",
            transaction.qstItc
          );
        }

        transactions.push(transaction);
        console.log("✅ Transaction ajoutée à la liste:", docSnap.id);
      } else {
        console.log(
          "⏭️ Transaction ignorée (hors période):",
          docSnap.id,
          "Date:",
          data.date
        );
      }
    });

    // Trier par date décroissante (au cas où orderBy aurait échoué)
    transactions.sort((a, b) => b.date.localeCompare(a.date));

    console.log("✅ Nombre de transactions retournées:", transactions.length);
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

    // Nettoyer les données : enlever les champs undefined (Firestore ne les accepte pas)
    const cleanedTransaction: any = {
      id,
      userId,
      date: transaction.date,
      description: transaction.description || "",
      category: transaction.category || "",
      type: transaction.type,
      amount: transaction.amount,
      tags: transaction.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Ajouter les champs optionnels seulement s'ils sont définis
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
    if (
      transaction.deductibleRatio !== undefined &&
      transaction.deductibleRatio !== null
    )
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
      cleanedTransaction.classificationConfidence =
        transaction.classificationConfidence;
    }
    if (transaction.documents) cleanedTransaction.documents = transaction.documents;

    const transactionData: Transaction = cleanedTransaction as Transaction;

    console.log("📄 Données complètes de la transaction:", transactionData);

    const transactionRef = doc(db, "transactions", id);
    console.log("🔄 Chemin du document:", `transactions/${id}`);
    console.log("🔄 Exécution de setDoc()...");

    await setDoc(transactionRef, transactionData);
    console.log("✅ Transaction créée avec succès dans Firestore");

    // Vérifier que la transaction a bien été créée
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

    // Déclencher l'événement pour rafraîchir les listes
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

    const transactionData = transactionDoc.data();
    if (transactionData.userId !== userId) {
      console.error("❌ Accès refusé - La transaction n'appartient pas à l'utilisateur");
      return false;
    }

    // Nettoyer les données : enlever les champs undefined (Firestore ne les accepte pas)
    const cleanedUpdates: any = {
      date: updates.date,
      description: updates.description || "",
      category: updates.category || "",
      type: updates.type,
      amount: updates.amount,
      tags: updates.tags || [],
      updatedAt: new Date().toISOString(),
    };

    // Ajouter les champs optionnels seulement s'ils sont définis
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
    if (
      updates.deductibleRatio !== undefined &&
      updates.deductibleRatio !== null
    )
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
      cleanedUpdates.classificationConfidence =
        updates.classificationConfidence;
    }
    if (updates.documents) cleanedUpdates.documents = updates.documents;

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

    const transactionData = transactionDoc.data();
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

// ==================== DÉPENSES VÉHICULE ====================

export interface VehicleExpense {
  id: string;
  userId: string;
  vehicleName: string;
  periodStart: string;
  periodEnd: string;
  totalKm: number;
  businessKm: number;
  businessRatio: number;
  // Dépenses totales
  fuel: number;
  maintenance: number;
  insurance: number;
  registration: number;
  parkingAndTolls: number;
  leaseOrLoan: number;
  other: number;
  totalExpenses: number;
  // Dépenses directement liées au travail
  businessFuel: number;
  businessMaintenance: number;
  businessParkingAndTolls: number;
  businessOther: number;
  businessExpenses: number;
  deductibleTotal: number;
  // Taxes
  gstOnExpenses: number;
  qstOnExpenses: number;
  gstOnBusinessExpenses: number;
  qstOnBusinessExpenses: number;
  gstItc: number; // ITC GST total
  qstItc: number; // ITC QST total
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Récupère les dépenses véhicule pour une année donnée
 */
export async function getVehicleExpenses(year: number): Promise<VehicleExpense[]> {
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

    const startDate = new Date(year, 0, 1).toISOString().split("T")[0];
    const endDate = new Date(year, 11, 31).toISOString().split("T")[0];

    const vehicleExpensesRef = collection(db, "vehicleExpenses");
    const q = query(vehicleExpensesRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const expenses: VehicleExpense[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Filtrer par période en mémoire
      if (data.periodStart >= startDate && data.periodEnd <= endDate) {
        expenses.push({
          id: docSnap.id,
          ...data,
        } as VehicleExpense);
      }
    });

    return expenses.sort((a, b) => b.periodStart.localeCompare(a.periodStart));
  } catch (error: any) {
    console.error("❌ Erreur lors de la récupération des dépenses véhicule:", error);
    return [];
  }
}

/**
 * Ajoute une nouvelle dépense véhicule
 */
export async function addVehicleExpense(
  expense: Omit<
    VehicleExpense,
    | "id"
    | "userId"
    | "createdAt"
    | "updatedAt"
    | "totalExpenses"
    | "businessExpenses"
    | "gstItc"
    | "qstItc"
  >
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
    const totalExpenses =
      expense.fuel +
      expense.maintenance +
      expense.insurance +
      expense.registration +
      expense.parkingAndTolls +
      expense.leaseOrLoan +
      expense.other;
    const businessExpenses =
      expense.businessFuel +
      expense.businessMaintenance +
      expense.businessParkingAndTolls +
      expense.businessOther;
    // ITC total = (ITC sur dépenses totales × ratio) + ITC sur dépenses travail
    const gstItc =
      expense.gstOnExpenses * expense.businessRatio +
      expense.gstOnBusinessExpenses;
    const qstItc =
      expense.qstOnExpenses * expense.businessRatio +
      expense.qstOnBusinessExpenses;

    const expenseData: VehicleExpense = {
      id,
      userId,
      ...expense,
      totalExpenses,
      businessExpenses,
      gstItc,
      qstItc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const expenseRef = doc(db, "vehicleExpenses", id);
    await setDoc(expenseRef, expenseData);

    window.dispatchEvent(new Event("vehicleExpensesUpdated"));
    return id;
  } catch (error: any) {
    console.error("❌ Erreur lors de l'ajout de la dépense véhicule:", error);
    return null;
  }
}

/**
 * Supprime une dépense véhicule
 */
export async function deleteVehicleExpense(
  expenseId: string
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

    const expenseRef = doc(db, "vehicleExpenses", expenseId);
    const expenseDoc = await getDoc(expenseRef);

    if (!expenseDoc.exists()) {
      console.error("❌ Dépense véhicule non trouvée");
      return false;
    }

    const expenseData = expenseDoc.data();
    if (expenseData.userId !== userId) {
      console.error("❌ Accès refusé");
      return false;
    }

    await deleteDoc(expenseRef);
    window.dispatchEvent(new Event("vehicleExpensesUpdated"));
    return true;
  } catch (error: any) {
    console.error("❌ Erreur lors de la suppression de la dépense véhicule:", error);
    return false;
  }
}

// ==================== PROFIL ANNUEL VÉHICULE ====================

export interface VehicleAnnualProfile {
  id: string;
  userId: string;
  year: number;
  vehicleName: string;
  // Prévisions / coûts annuels
  estimatedTotalKm: number;
  estimatedBusinessKm: number;
  annualLeaseOrLoan: number;
  annualInsurance: number;
  annualRegistration: number;
  annualFuelBudget: number;
  annualMaintenanceBudget: number;
  annualOther: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Récupère le profil annuel de véhicule pour une année donnée
 */
export async function getVehicleAnnualProfile(
  year: number
): Promise<VehicleAnnualProfile | null> {
  if (!db) {
    console.warn("❌ Firestore non initialisé");
    return null;
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn("❌ Utilisateur non authentifié");
      return null;
    }

    const ref = collection(db, "vehicleAnnualProfiles");
    const q = query(ref, where("userId", "==", userId), where("year", "==", year));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    return {
      id: docSnap.id,
      ...(docSnap.data() as any),
    } as VehicleAnnualProfile;
  } catch (error: any) {
    console.error(
      "❌ Erreur lors de la récupération du profil annuel véhicule:",
      error
    );
    return null;
  }
}

/**
 * Crée ou met à jour le profil annuel de véhicule
 */
export async function upsertVehicleAnnualProfile(
  year: number,
  data: Omit<
    VehicleAnnualProfile,
    "id" | "userId" | "year" | "createdAt" | "updatedAt"
  >
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

    const existing = await getVehicleAnnualProfile(year);
    const now = new Date().toISOString();

    if (existing) {
      const ref = doc(db, "vehicleAnnualProfiles", existing.id);
      await updateDoc(ref, {
        ...data,
        updatedAt: now,
      });
      window.dispatchEvent(new Event("vehicleAnnualProfileUpdated"));
      return existing.id;
    } else {
      const id = nanoid();
      const ref = doc(db, "vehicleAnnualProfiles", id);
      const payload: VehicleAnnualProfile = {
        id,
        userId,
        year,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(ref, payload);
      window.dispatchEvent(new Event("vehicleAnnualProfileUpdated"));
      return id;
    }
  } catch (error: any) {
    console.error(
      "❌ Erreur lors de la création/mise à jour du profil annuel véhicule:",
      error
    );
    return null;
  }
}

/**
 * Supprime le profil annuel véhicule pour une année donnée
 */
export async function deleteVehicleAnnualProfile(
  year: number
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

    const refCol = collection(db, "vehicleAnnualProfiles");
    const q = query(refCol, where("userId", "==", userId), where("year", "==", year));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return true;
    }

    const docSnap = snapshot.docs[0];
    const ref = doc(db, "vehicleAnnualProfiles", docSnap.id);
    await deleteDoc(ref);
    window.dispatchEvent(new Event("vehicleAnnualProfileUpdated"));
    return true;
  } catch (error: any) {
    console.error(
      "❌ Erreur lors de la suppression du profil annuel véhicule:",
      error
    );
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
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Récupère les dépenses bureau à domicile pour une année donnée
 */
export async function getHomeOfficeExpenses(
  year: number
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

    const startDate = new Date(year, 0, 1).toISOString().split("T")[0];
    const endDate = new Date(year, 11, 31).toISOString().split("T")[0];

    const ref = collection(db, "homeOfficeExpenses");
    const q = query(ref, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const expenses: HomeOfficeExpense[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.periodStart >= startDate && data.periodEnd <= endDate) {
        expenses.push({
          id: docSnap.id,
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

/**
 * Ajoute une dépense bureau à domicile
 */
export async function addHomeOfficeExpense(
  expense: Omit<
    HomeOfficeExpense,
    "id" | "userId" | "createdAt" | "updatedAt" | "totalExpenses" | "deductibleTotal"
  >
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
    const totalExpenses =
      expense.rent +
      expense.electricityHeating +
      expense.condoFees +
      expense.propertyTaxes +
      expense.homeInsurance +
      expense.other;
    const deductibleTotal = totalExpenses * (expense.businessAreaRatio || 0);

    const expenseData: HomeOfficeExpense = {
      id,
      userId,
      ...expense,
      totalExpenses,
      deductibleTotal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = doc(db, "homeOfficeExpenses", id);
    await setDoc(ref, expenseData);
    window.dispatchEvent(new Event("homeOfficeExpensesUpdated"));
    return id;
  } catch (error: any) {
    console.error(
      "❌ Erreur lors de l'ajout de la dépense bureau à domicile:",
      error
    );
    return null;
  }
}

/**
 * Supprime une dépense bureau à domicile
 */
export async function deleteHomeOfficeExpense(
  expenseId: string
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

    const ref = doc(db, "homeOfficeExpenses", expenseId);
    const docSnap = await getDoc(ref);

    if (!docSnap.exists()) {
      console.error("❌ Dépense bureau à domicile non trouvée");
      return false;
    }

    const data = docSnap.data();
    if (data.userId !== userId) {
      console.error("❌ Accès refusé");
      return false;
    }

    await deleteDoc(ref);
    window.dispatchEvent(new Event("homeOfficeExpensesUpdated"));
    return true;
  } catch (error: any) {
    console.error(
      "❌ Erreur lors de la suppression de la dépense bureau à domicile:",
      error
    );
    return false;
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
  deductibleTotal: number;
  capitalizableHardware: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Récupère les dépenses techno pour une année donnée
 */
export async function getTechExpenses(year: number): Promise<TechExpense[]> {
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

    const startDate = new Date(year, 0, 1).toISOString().split("T")[0];
    const endDate = new Date(year, 11, 31).toISOString().split("T")[0];

    const ref = collection(db, "techExpenses");
    const q = query(ref, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const expenses: TechExpense[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.periodStart >= startDate && data.periodEnd <= endDate) {
        expenses.push({
          id: docSnap.id,
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

/**
 * Ajoute une dépense techno
 */
export async function addTechExpense(
  expense: Omit<
    TechExpense,
    "id" | "userId" | "createdAt" | "updatedAt" | "deductibleTotal" | "capitalizableHardware"
  >
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

    const internetRatio = Math.min(
      Math.max(expense.internetBusinessRatio || 0, 0),
      1
    );
    const phoneRatio = Math.min(
      Math.max(expense.phoneBusinessRatio || 0, 0),
      1
    );

    const deductibleTotal =
      expense.hardwareSmallEquipment +
      expense.softwareLicenses +
      expense.saasSubscriptions +
      expense.internetTotal * internetRatio +
      expense.phoneTotal * phoneRatio +
      expense.otherTech;

    const capitalizableHardware = expense.hardwareCapitalAssets;

    const expenseData: TechExpense = {
      id,
      userId,
      ...expense,
      deductibleTotal,
      capitalizableHardware,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = doc(db, "techExpenses", id);
    await setDoc(ref, expenseData);
    window.dispatchEvent(new Event("techExpensesUpdated"));
    return id;
  } catch (error: any) {
    console.error("❌ Erreur lors de l'ajout de la dépense techno:", error);
    return null;
  }
}

/**
 * Supprime une dépense techno
 */
export async function deleteTechExpense(expenseId: string): Promise<boolean> {
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

    const ref = doc(db, "techExpenses", expenseId);
    const docSnap = await getDoc(ref);

    if (!docSnap.exists()) {
      console.error("❌ Dépense techno non trouvée");
      return false;
    }

    const data = docSnap.data();
    if (data.userId !== userId) {
      console.error("❌ Accès refusé");
      return false;
    }

    await deleteDoc(ref);
    window.dispatchEvent(new Event("techExpensesUpdated"));
    return true;
  } catch (error: any) {
    console.error("❌ Erreur lors de la suppression de la dépense techno:", error);
    return false;
  }
}
