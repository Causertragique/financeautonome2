// Service pour gérer l'upload et le téléchargement de documents

import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { getAuth } from "firebase/auth";

export interface Document {
  name: string;
  url: string;
  uploadedAt: string;
}

/**
 * Upload un document pour une transaction
 */
export async function uploadTransactionDocument(
  transactionId: string,
  file: File
): Promise<Document | null> {
  if (!storage) {
    console.error("❌ Storage non initialisé");
    return null;
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("❌ Utilisateur non authentifié");
      return null;
    }

    // Créer une référence pour le fichier
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storageRef = ref(storage, `transactions/${userId}/${transactionId}/${fileName}`);

    console.log("📤 Upload du document:", fileName);
    
    // Upload le fichier
    const snapshot = await uploadBytes(storageRef, file);
    console.log("✅ Document uploadé avec succès");

    // Obtenir l'URL de téléchargement
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("✅ URL de téléchargement obtenue:", downloadURL);

    return {
      name: file.name,
      url: downloadURL,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("❌ Erreur lors de l'upload du document:", error);
    console.error("❌ Code d'erreur:", error?.code);
    console.error("❌ Message:", error?.message);
    return null;
  }
}

/**
 * Supprime un document d'une transaction
 */
export async function deleteTransactionDocument(
  transactionId: string,
  documentUrl: string
): Promise<boolean> {
  if (!storage) {
    console.error("❌ Storage non initialisé");
    return false;
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("❌ Utilisateur non authentifié");
      return false;
    }

    // Extraire le chemin du fichier depuis l'URL
    // L'URL Firebase Storage a le format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
    const urlObj = new URL(documentUrl);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
    
    if (!pathMatch) {
      console.error("❌ Impossible d'extraire le chemin du fichier depuis l'URL");
      return false;
    }

    const filePath = decodeURIComponent(pathMatch[1]);
    const fileRef = ref(storage, filePath);

    console.log("🗑️ Suppression du document:", filePath);
    await deleteObject(fileRef);
    console.log("✅ Document supprimé avec succès");

    return true;
  } catch (error: any) {
    console.error("❌ Erreur lors de la suppression du document:", error);
    console.error("❌ Code d'erreur:", error?.code);
    console.error("❌ Message:", error?.message);
    return false;
  }
}

/**
 * Récupère tous les documents d'une transaction
 */
export async function getTransactionDocuments(transactionId: string): Promise<Document[]> {
  if (!storage) {
    console.error("❌ Storage non initialisé");
    return [];
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("❌ Utilisateur non authentifié");
      return [];
    }

    const folderRef = ref(storage, `transactions/${userId}/${transactionId}`);
    const listResult = await listAll(folderRef);

    const documents: Document[] = [];
    
    for (const itemRef of listResult.items) {
      try {
        const url = await getDownloadURL(itemRef);
        // Extraire le nom original du fichier depuis le nom stocké
        const fileName = itemRef.name.replace(/^\d+_/, ''); // Enlever le timestamp
        documents.push({
          name: fileName,
          url: url,
          uploadedAt: new Date().toISOString(), // On pourrait stocker la date dans les métadonnées
        });
      } catch (error) {
        console.warn("⚠️ Impossible de récupérer l'URL pour:", itemRef.name);
      }
    }

    return documents;
  } catch (error: any) {
    // Si le dossier n'existe pas, retourner un tableau vide
    if (error?.code === 'storage/object-not-found') {
      return [];
    }
    console.error("❌ Erreur lors de la récupération des documents:", error);
    return [];
  }
}

/**
 * Upload une photo de profil pour l'utilisateur
 */
export async function uploadProfilePhoto(file: File): Promise<string | null> {
  if (!storage) {
    console.error("❌ Storage non initialisé");
    return null;
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("❌ Utilisateur non authentifié");
      return null;
    }

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      console.error("❌ Le fichier n'est pas une image");
      return null;
    }

    // Créer une référence pour le fichier
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `profile_${userId}_${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, `users/${userId}/profile/${fileName}`);

    console.log("📤 Upload de la photo de profil:", fileName);
    
    // Upload le fichier
    const snapshot = await uploadBytes(storageRef, file);
    console.log("✅ Photo de profil uploadée avec succès");

    // Obtenir l'URL de téléchargement
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("✅ URL de téléchargement obtenue:", downloadURL);

    return downloadURL;
  } catch (error: any) {
    console.error("❌ Erreur lors de l'upload de la photo de profil:", error);
    console.error("❌ Code d'erreur:", error?.code);
    console.error("❌ Message:", error?.message);
    return null;
  }
}

/**
 * Supprime l'ancienne photo de profil
 */
export async function deleteProfilePhoto(photoURL: string): Promise<boolean> {
  if (!storage) {
    console.error("❌ Storage non initialisé");
    return false;
  }

  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("❌ Utilisateur non authentifié");
      return false;
    }

    // Si l'URL ne vient pas de Firebase Storage (ex: Google profile photo), on ne peut pas la supprimer
    if (!photoURL.includes('firebasestorage.googleapis.com')) {
      console.log("ℹ️ La photo de profil ne vient pas de Firebase Storage, pas de suppression nécessaire");
      return true;
    }

    // Extraire le chemin du fichier depuis l'URL
    const urlObj = new URL(photoURL);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
    
    if (!pathMatch) {
      console.error("❌ Impossible d'extraire le chemin du fichier depuis l'URL");
      return false;
    }

    const filePath = decodeURIComponent(pathMatch[1]);
    const fileRef = ref(storage, filePath);

    console.log("🗑️ Suppression de l'ancienne photo de profil:", filePath);
    await deleteObject(fileRef);
    console.log("✅ Ancienne photo de profil supprimée avec succès");

    return true;
  } catch (error: any) {
    // Si le fichier n'existe pas, ce n'est pas grave
    if (error?.code === 'storage/object-not-found') {
      console.log("ℹ️ L'ancienne photo de profil n'existe plus");
      return true;
    }
    console.error("❌ Erreur lors de la suppression de l'ancienne photo de profil:", error);
    return false;
  }
}

