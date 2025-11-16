import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  type Firestore,
  type DocumentData,
  type QuerySnapshot
} from "firebase/firestore";
import { db } from "./firebase";

// Types pour les transactions
export interface Transaction {
  id?: string;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  company?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Vérifier si on doit utiliser les données mock (localStorage) ou Firestore
const shouldUseMock = (year: number): boolean => {
  // Utiliser mock pour 2025 uniquement
  return year === 2025;
};

// Charger les transactions depuis Firestore
export const getTransactions = async (year: number): Promise<Transaction[]> => {
  // Si année 2025, utiliser localStorage (mock)
  if (shouldUseMock(year)) {
    try {
      const saved = localStorage.getItem("transactions");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des transactions mock:", error);
    }
    return [];
  }

  // Sinon, utiliser Firestore
  if (!db) {
    console.warn("⚠️ Firestore n'est pas initialisé. Utilisation de localStorage.");
    return [];
  }

  try {
    const transactionsRef = collection(db, "transactions");
    
    // Calculer les dates de début et fin d'année
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    // Créer la requête pour filtrer par année
    const q = query(
      transactionsRef,
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "desc")
    );
    
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];
  } catch (error) {
    console.error("Erreur lors du chargement des transactions depuis Firestore:", error);
    return [];
  }
};

// Ajouter une transaction dans Firestore
export const addTransaction = async (transaction: Omit<Transaction, "id">): Promise<string | null> => {
  const year = new Date(transaction.date).getFullYear();
  
  // Si année 2025, utiliser localStorage (mock)
  if (shouldUseMock(year)) {
    try {
      const saved = localStorage.getItem("transactions");
      const existing = saved ? JSON.parse(saved) : [];
      const newTransaction = {
        ...transaction,
        id: Date.now().toString(),
      };
      const updated = [...existing, newTransaction];
      localStorage.setItem("transactions", JSON.stringify(updated));
      
      // Déclencher l'événement pour mettre à jour Accounting
      window.dispatchEvent(new Event("transactionsUpdated"));
      
      return newTransaction.id;
    } catch (error) {
      console.error("Erreur lors de l'ajout de la transaction mock:", error);
      return null;
    }
  }

  // Sinon, utiliser Firestore
  if (!db) {
    console.warn("⚠️ Firestore n'est pas initialisé. Impossible d'ajouter la transaction.");
    return null;
  }

  try {
    const transactionsRef = collection(db, "transactions");
    const docRef = await addDoc(transactionsRef, {
      ...transaction,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Déclencher l'événement pour mettre à jour Accounting
    window.dispatchEvent(new Event("transactionsUpdated"));
    
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout de la transaction dans Firestore:", error);
    return null;
  }
};

// Mettre à jour une transaction dans Firestore
export const updateTransaction = async (
  transactionId: string,
  updates: Partial<Transaction>
): Promise<boolean> => {
  if (!db) {
    console.warn("⚠️ Firestore n'est pas initialisé. Impossible de mettre à jour la transaction.");
    return false;
  }

  try {
    const transactionRef = doc(db, "transactions", transactionId);
    await updateDoc(transactionRef, {
      ...updates,
      updatedAt: new Date(),
    });
    
    // Déclencher l'événement pour mettre à jour Accounting
    window.dispatchEvent(new Event("transactionsUpdated"));
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la transaction:", error);
    return false;
  }
};

// Supprimer une transaction de Firestore
export const deleteTransaction = async (transactionId: string): Promise<boolean> => {
  if (!db) {
    console.warn("⚠️ Firestore n'est pas initialisé. Impossible de supprimer la transaction.");
    return false;
  }

  try {
    const transactionRef = doc(db, "transactions", transactionId);
    await deleteDoc(transactionRef);
    
    // Déclencher l'événement pour mettre à jour Accounting
    window.dispatchEvent(new Event("transactionsUpdated"));
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression de la transaction:", error);
    return false;
  }
};

// Écouter les changements de transactions (en temps réel)
export const subscribeToTransactions = (
  year: number,
  callback: (transactions: Transaction[]) => void
): (() => void) => {
  // Si année 2025, utiliser localStorage avec événements
  if (shouldUseMock(year)) {
    const handleUpdate = () => {
      getTransactions(year).then(callback);
    };
    
    window.addEventListener("transactionsUpdated", handleUpdate);
    handleUpdate(); // Charger immédiatement
    
    return () => {
      window.removeEventListener("transactionsUpdated", handleUpdate);
    };
  }

  // Pour Firestore, on pourrait utiliser onSnapshot, mais pour simplifier,
  // on utilise getTransactions avec un polling ou onSnapshot
  // Pour l'instant, on retourne une fonction de nettoyage vide
  // TODO: Implémenter onSnapshot pour Firestore si nécessaire
  return () => {};
};

