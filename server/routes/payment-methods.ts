import { RequestHandler } from "express";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { nanoid } from "nanoid";
import dotenv from "dotenv";

dotenv.config();

// Initialiser Firebase pour le serveur
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error("Erreur lors de l'initialisation de Firebase côté serveur:", error);
}

// Interface pour les modes de paiement
interface PaymentMethod {
  id: string;
  userId: string;
  type: string;
  label: string;
  last4?: string;
  expiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Récupérer tous les modes de paiement d'un utilisateur
export const getPaymentMethods: RequestHandler = async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: "Base de données non initialisée" });
    }

    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "userId requis" });
    }

    const paymentMethodsRef = collection(db, "paymentMethods");
    const q = query(paymentMethodsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const paymentMethods: PaymentMethod[] = [];
    snapshot.forEach((doc) => {
      paymentMethods.push({
        id: doc.id,
        ...doc.data(),
      } as PaymentMethod);
    });

    res.json({ paymentMethods });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des modes de paiement:", error);
    res.status(500).json({ error: error.message || "Erreur serveur" });
  }
};

// Ajouter un mode de paiement
export const createPaymentMethod: RequestHandler = async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: "Base de données non initialisée" });
    }

    const userId = req.body.userId;
    const { type, label, last4, expiryDate } = req.body;

    if (!userId || !type || !label) {
      return res.status(400).json({ error: "userId, type et label requis" });
    }

    const id = nanoid();
    const paymentMethodData = {
      id,
      userId,
      type,
      label,
      last4: last4 || null,
      expiryDate: expiryDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const paymentMethodRef = doc(db, "paymentMethods", id);
    await setDoc(paymentMethodRef, paymentMethodData);

    res.json({ paymentMethod: paymentMethodData });
  } catch (error: any) {
    console.error("Erreur lors de la création du mode de paiement:", error);
    res.status(500).json({ error: error.message || "Erreur serveur" });
  }
};

// Supprimer un mode de paiement
export const deletePaymentMethod: RequestHandler = async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: "Base de données non initialisée" });
    }

    const userId = req.body.userId;
    const { id } = req.params;

    if (!userId || !id) {
      return res.status(400).json({ error: "userId et id requis" });
    }

    // Vérifier que le mode de paiement appartient à l'utilisateur
    const paymentMethodRef = doc(db, "paymentMethods", id);
    const paymentMethodDoc = await getDoc(paymentMethodRef);
    
    if (!paymentMethodDoc.exists()) {
      return res.status(404).json({ error: "Mode de paiement non trouvé" });
    }

    const paymentMethodData = paymentMethodDoc.data();
    if (paymentMethodData.userId !== userId) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    await deleteDoc(paymentMethodRef);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Erreur lors de la suppression du mode de paiement:", error);
    res.status(500).json({ error: error.message || "Erreur serveur" });
  }
};
