/**
 * Script de migration pour déplacer les données des collections racines
 * vers les sous-collections users/{userId}/
 */

import { db } from "./firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * Migre toutes les transactions de l'utilisateur connecté
 */
export async function migrateTransactions(): Promise<{ migrated: number; errors: number }> {
  if (!db) {
    console.error("❌ Firestore non initialisé");
    return { migrated: 0, errors: 0 };
  }

  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.error("❌ Utilisateur non authentifié");
    return { migrated: 0, errors: 0 };
  }

  let migrated = 0;
  let errors = 0;

  try {
    console.log("🔄 Début de la migration des transactions...");
    
    // Récupérer toutes les transactions de l'ancienne collection
    const oldTransactionsRef = collection(db, "transactions");
    const q = query(oldTransactionsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    console.log(`📊 ${snapshot.size} transaction(s) trouvée(s) à migrer`);

    if (snapshot.size === 0) {
      console.log("✅ Aucune transaction à migrer");
      return { migrated: 0, errors: 0 };
    }

    // Migrer document par document pour éviter les problèmes de batch
    for (const docSnap of snapshot.docs) {
      try {
        const data = docSnap.data();
        
        // Créer dans la nouvelle collection
        const newTransactionRef = doc(db, "users", userId, "transactions", docSnap.id);
        
        // Nettoyer les données : supprimer userId car il est dans le chemin
        const cleanedData = { ...data };
        delete cleanedData.userId;
        
        // Vérifier si le document existe déjà dans la nouvelle collection
        const existingDoc = await getDocs(query(collection(db, "users", userId, "transactions"), where("__name__", "==", docSnap.id)));
        
        if (existingDoc.empty) {
          // Créer dans la nouvelle collection
          await setDoc(newTransactionRef, cleanedData);
          console.log(`✅ Transaction ${docSnap.id} créée dans la nouvelle collection`);
        } else {
          console.log(`ℹ️ Transaction ${docSnap.id} existe déjà dans la nouvelle collection`);
        }
        
        // Supprimer de l'ancienne collection
        await deleteDoc(docSnap.ref);
        console.log(`✅ Transaction ${docSnap.id} supprimée de l'ancienne collection`);
        
        migrated++;
        
        // Afficher la progression tous les 10 documents
        if (migrated % 10 === 0) {
          console.log(`✅ ${migrated} transaction(s) migrée(s)...`);
        }
      } catch (docError: any) {
        console.error(`❌ Erreur lors de la migration de la transaction ${docSnap.id}:`, docError);
        console.error(`❌ Code:`, docError?.code);
        console.error(`❌ Message:`, docError?.message);
        errors++;
      }
    }

    console.log(`✅ Migration terminée : ${migrated} transaction(s) migrée(s)`);
    return { migrated, errors };
  } catch (error: any) {
    console.error("❌ Erreur lors de la migration des transactions:", error);
    console.error("❌ Code d'erreur:", error?.code);
    console.error("❌ Message:", error?.message);
    errors++;
    return { migrated, errors };
  }
}

/**
 * Migre toutes les entreprises de l'utilisateur connecté
 */
export async function migrateCompanies(): Promise<{ migrated: number; errors: number }> {
  if (!db) {
    console.error("❌ Firestore non initialisé");
    return { migrated: 0, errors: 0 };
  }

  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.error("❌ Utilisateur non authentifié");
    return { migrated: 0, errors: 0 };
  }

  let migrated = 0;
  let errors = 0;

  try {
    console.log("🔄 Début de la migration des entreprises...");
    
    const oldCompaniesRef = collection(db, "companies");
    const q = query(oldCompaniesRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    console.log(`📊 ${snapshot.size} entreprise(s) trouvée(s) à migrer`);

    if (snapshot.size === 0) {
      console.log("✅ Aucune entreprise à migrer");
      return { migrated: 0, errors: 0 };
    }

    const batch = writeBatch(db);
    let batchCount = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const newCompanyRef = doc(db, "users", userId, "companies", docSnap.id);
      
      // Nettoyer les données
      const cleanedData = { ...data };
      delete cleanedData.userId;
      
      batch.set(newCompanyRef, cleanedData);
      batch.delete(docSnap.ref);
      batchCount++;
    }

    if (batchCount > 0) {
      await batch.commit();
      migrated = batchCount;
    }

    console.log(`✅ Migration terminée : ${migrated} entreprise(s) migrée(s)`);
    return { migrated, errors };
  } catch (error: any) {
    console.error("❌ Erreur lors de la migration des entreprises:", error);
    errors++;
    return { migrated, errors };
  }
}

/**
 * Migre toutes les dépenses véhicule de l'utilisateur connecté
 */
export async function migrateVehicleExpenses(): Promise<{ migrated: number; errors: number }> {
  if (!db) {
    return { migrated: 0, errors: 0 };
  }

  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) {
    return { migrated: 0, errors: 0 };
  }

  let migrated = 0;
  let errors = 0;

  try {
    console.log("🔄 Début de la migration des dépenses véhicule...");
    
    const oldRef = collection(db, "vehicleExpenses");
    const q = query(oldRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    console.log(`📊 ${snapshot.size} dépense(s) véhicule trouvée(s) à migrer`);

    if (snapshot.size === 0) {
      return { migrated: 0, errors: 0 };
    }

    const batch = writeBatch(db);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const newRef = doc(db, "users", userId, "vehicleExpenses", docSnap.id);
      
      // Nettoyer les données
      const cleanedData = { ...data };
      delete cleanedData.userId;
      
      batch.set(newRef, cleanedData);
      batch.delete(docSnap.ref);
      migrated++;
    }

    await batch.commit();
    console.log(`✅ Migration terminée : ${migrated} dépense(s) véhicule migrée(s)`);
    return { migrated, errors };
  } catch (error: any) {
    console.error("❌ Erreur lors de la migration des dépenses véhicule:", error);
    errors++;
    return { migrated, errors };
  }
}

/**
 * Migre tous les profils annuels véhicule
 */
export async function migrateVehicleAnnualProfiles(): Promise<{ migrated: number; errors: number }> {
  if (!db) {
    return { migrated: 0, errors: 0 };
  }

  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) {
    return { migrated: 0, errors: 0 };
  }

  let migrated = 0;
  let errors = 0;

  try {
    console.log("🔄 Début de la migration des profils annuels véhicule...");
    
    const oldRef = collection(db, "vehicleAnnualProfiles");
    const q = query(oldRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    console.log(`📊 ${snapshot.size} profil(s) annuel(s) trouvé(s) à migrer`);

    if (snapshot.size === 0) {
      return { migrated: 0, errors: 0 };
    }

    const batch = writeBatch(db);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const newRef = doc(db, "users", userId, "vehicleAnnualProfiles", docSnap.id);
      
      // Nettoyer les données
      const cleanedData = { ...data };
      delete cleanedData.userId;
      
      batch.set(newRef, cleanedData);
      batch.delete(docSnap.ref);
      migrated++;
    }

    await batch.commit();
    console.log(`✅ Migration terminée : ${migrated} profil(s) annuel(s) migré(s)`);
    return { migrated, errors };
  } catch (error: any) {
    console.error("❌ Erreur lors de la migration des profils annuels:", error);
    errors++;
    return { migrated, errors };
  }
}

/**
 * Migre toutes les dépenses bureau à domicile
 */
export async function migrateHomeOfficeExpenses(): Promise<{ migrated: number; errors: number }> {
  if (!db) {
    return { migrated: 0, errors: 0 };
  }

  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) {
    return { migrated: 0, errors: 0 };
  }

  let migrated = 0;
  let errors = 0;

  try {
    console.log("🔄 Début de la migration des dépenses bureau à domicile...");
    
    const oldRef = collection(db, "homeOfficeExpenses");
    const q = query(oldRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    console.log(`📊 ${snapshot.size} dépense(s) bureau à domicile trouvée(s) à migrer`);

    if (snapshot.size === 0) {
      return { migrated: 0, errors: 0 };
    }

    const batch = writeBatch(db);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const newRef = doc(db, "users", userId, "homeOfficeExpenses", docSnap.id);
      
      // Nettoyer les données
      const cleanedData = { ...data };
      delete cleanedData.userId;
      
      batch.set(newRef, cleanedData);
      batch.delete(docSnap.ref);
      migrated++;
    }

    await batch.commit();
    console.log(`✅ Migration terminée : ${migrated} dépense(s) bureau à domicile migrée(s)`);
    return { migrated, errors };
  } catch (error: any) {
    console.error("❌ Erreur lors de la migration des dépenses bureau à domicile:", error);
    errors++;
    return { migrated, errors };
  }
}

/**
 * Migre toutes les dépenses techno
 */
export async function migrateTechExpenses(): Promise<{ migrated: number; errors: number }> {
  if (!db) {
    return { migrated: 0, errors: 0 };
  }

  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) {
    return { migrated: 0, errors: 0 };
  }

  let migrated = 0;
  let errors = 0;

  try {
    console.log("🔄 Début de la migration des dépenses techno...");
    
    const oldRef = collection(db, "techExpenses");
    const q = query(oldRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    console.log(`📊 ${snapshot.size} dépense(s) techno trouvée(s) à migrer`);

    if (snapshot.size === 0) {
      return { migrated: 0, errors: 0 };
    }

    const batch = writeBatch(db);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const newRef = doc(db, "users", userId, "techExpenses", docSnap.id);
      
      // Nettoyer les données
      const cleanedData = { ...data };
      delete cleanedData.userId;
      
      batch.set(newRef, cleanedData);
      batch.delete(docSnap.ref);
      migrated++;
    }

    await batch.commit();
    console.log(`✅ Migration terminée : ${migrated} dépense(s) techno migrée(s)`);
    return { migrated, errors };
  } catch (error: any) {
    console.error("❌ Erreur lors de la migration des dépenses techno:", error);
    errors++;
    return { migrated, errors };
  }
}

/**
 * Migre tous les actifs
 */
export async function migrateAssets(): Promise<{ migrated: number; errors: number }> {
  if (!db) {
    return { migrated: 0, errors: 0 };
  }

  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  if (!userId) {
    return { migrated: 0, errors: 0 };
  }

  let migrated = 0;
  let errors = 0;

  try {
    console.log("🔄 Début de la migration des actifs...");
    
    const oldRef = collection(db, "assets");
    const q = query(oldRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    console.log(`📊 ${snapshot.size} actif(s) trouvé(s) à migrer`);

    if (snapshot.size === 0) {
      return { migrated: 0, errors: 0 };
    }

    const batch = writeBatch(db);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const newRef = doc(db, "users", userId, "assets", docSnap.id);
      
      // Nettoyer les données
      const cleanedData = { ...data };
      delete cleanedData.userId;
      
      batch.set(newRef, cleanedData);
      batch.delete(docSnap.ref);
      migrated++;
    }

    await batch.commit();
    console.log(`✅ Migration terminée : ${migrated} actif(s) migré(s)`);
    return { migrated, errors };
  } catch (error: any) {
    console.error("❌ Erreur lors de la migration des actifs:", error);
    errors++;
    return { migrated, errors };
  }
}

/**
 * Migre toutes les données de l'utilisateur connecté
 */
export async function migrateAllData(): Promise<{
  transactions: { migrated: number; errors: number };
  companies: { migrated: number; errors: number };
  vehicleExpenses: { migrated: number; errors: number };
  vehicleAnnualProfiles: { migrated: number; errors: number };
  homeOfficeExpenses: { migrated: number; errors: number };
  techExpenses: { migrated: number; errors: number };
  assets: { migrated: number; errors: number };
  total: { migrated: number; errors: number };
}> {
  console.log("🚀 Début de la migration complète des données...");
  
  const transactions = await migrateTransactions();
  const companies = await migrateCompanies();
  const vehicleExpenses = await migrateVehicleExpenses();
  const vehicleAnnualProfiles = await migrateVehicleAnnualProfiles();
  const homeOfficeExpenses = await migrateHomeOfficeExpenses();
  const techExpenses = await migrateTechExpenses();
  const assets = await migrateAssets();

  const total = {
    migrated:
      transactions.migrated +
      companies.migrated +
      vehicleExpenses.migrated +
      vehicleAnnualProfiles.migrated +
      homeOfficeExpenses.migrated +
      techExpenses.migrated +
      assets.migrated,
    errors:
      transactions.errors +
      companies.errors +
      vehicleExpenses.errors +
      vehicleAnnualProfiles.errors +
      homeOfficeExpenses.errors +
      techExpenses.errors +
      assets.errors,
  };

  console.log("✅ Migration complète terminée !");
  console.log(`📊 Total : ${total.migrated} document(s) migré(s), ${total.errors} erreur(s)`);

  return {
    transactions,
    companies,
    vehicleExpenses,
    vehicleAnnualProfiles,
    homeOfficeExpenses,
    techExpenses,
    assets,
    total,
  };
}

