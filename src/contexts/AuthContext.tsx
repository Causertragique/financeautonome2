import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  linkWithCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, getFirestore, collection } from "firebase/firestore";
import { getApp } from "firebase/app";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  signup: (email: string, password: string, usageType?: "business" | "personal" | "both") => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  linkEmailPassword: (email: string, password: string) => Promise<void>;
  linkGoogleAccount: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour créer ou mettre à jour le profil utilisateur dans Firestore
  const ensureUserProfile = async (user: FirebaseUser, usageType?: "business" | "personal" | "both") => {
    // Obtenir Firestore de manière fiable
    let database = db;
    if (!database) {
      try {
        const app = getApp();
        database = getFirestore(app);
      } catch (error) {
        console.error("❌ Impossible d'obtenir Firestore:", error);
        throw error;
      }
    }

    if (!database) {
      console.error("❌ Firestore non disponible");
      throw new Error("Firestore non disponible");
    }

    const userRef = doc(database, "users", user.uid);
    const existingDoc = await getDoc(userRef);
    const existingData = existingDoc.exists() ? existingDoc.data() : {};
    
    // Logique pour usageType : TOUJOURS préserver celui qui existe déjà dans Firestore
    // - Si l'utilisateur a changé l'usageType dans les paramètres, il est sauvegardé dans Firestore
    // - Lors de la connexion, on préserve toujours la valeur existante (ne jamais écraser)
    // - Lors de l'inscription, on peut définir un nouveau usageType si aucun n'existe
    let finalUsageType: "business" | "personal" | "both" | null;
    if (existingData.usageType) {
      // Si un usageType existe déjà dans Firestore, on le préserve TOUJOURS
      // Cela inclut les changements faits dans les paramètres du compte
      finalUsageType = existingData.usageType;
    } else if (usageType) {
      // Sinon, on utilise celui passé en paramètre (lors de l'inscription uniquement)
      finalUsageType = usageType;
    } else {
      // Sinon, null (pas encore défini)
      finalUsageType = null;
    }
    
    const newUserData = {
      userId: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      // L'usageType choisi à la création est TOUJOURS préservé
      usageType: finalUsageType,
      createdAt: existingData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    try {
      // Utiliser setDoc avec merge pour créer ou mettre à jour
      await setDoc(userRef, newUserData, { merge: true });
      
      // Initialiser la structure Users/{userId}/data/{mode}/ pour les nouveaux comptes
      if (finalUsageType) {
        const isNewUser = !existingDoc.exists();
        if (isNewUser) {
          // Créer la structure Users/{userId}/data/{mode}/ selon le usageType
          const modesToInitialize: Array<"personnelle" | "entreprise"> = [];
          
          if (finalUsageType === "both") {
            modesToInitialize.push("personnelle", "entreprise");
          } else if (finalUsageType === "business") {
            modesToInitialize.push("entreprise");
          } else if (finalUsageType === "personal") {
            modesToInitialize.push("personnelle");
          }
          
          // Initialiser chaque mode en créant la structure Users/{userId}/data/{mode}/
          // La structure sera créée automatiquement lors de la première écriture dans une collection
          // On crée un document d'initialisation minimal qui reste en place
          for (const mode of modesToInitialize) {
            try {
              // Créer un document d'initialisation dans la collection transactions pour initialiser la structure
              const transactionsRef = collection(database, "Users", user.uid, "data", mode, "transactions");
              const initDocRef = doc(transactionsRef, "__init__");
              await setDoc(initDocRef, { 
                _initialized: true, 
                _type: "initialization",
                createdAt: new Date().toISOString() 
              }, { merge: true });
            } catch (initError: any) {
              // Ignorer les erreurs d'initialisation (la structure sera créée lors de la première vraie écriture)
              if (initError?.code !== "permission-denied") {
                console.warn(`⚠️ Impossible d'initialiser Users/${user.uid}/data/${mode}/:`, initError?.message);
              }
            }
          }
        }
      }
      
      // Vérifier immédiatement si les données existent
      try {
        const snapshot = await getDoc(userRef);
        if (!snapshot.exists()) {
          console.warn("⚠️ Profil créé mais pas encore visible (synchronisation en cours)");
        }
      } catch (verifyError: any) {
        console.warn("⚠️ Impossible de vérifier le profil:", verifyError?.code, verifyError?.message);
      }
    } catch (error: any) {
      console.error("❌ Erreur lors de setDoc():", error);
      console.error("❌ Code d'erreur:", error?.code);
      console.error("❌ Message:", error?.message);
      console.error("❌ Stack:", error?.stack);
      
      if (error?.code === 'permission-denied') {
        console.error("❌ Permission refusée - Vérifiez les règles Firestore");
        console.error("❌ Assurez-vous que les règles permettent l'écriture pour users/{userId}");
        throw error;
      } else {
        console.error("❌ Erreur Firestore:", error?.code, error?.message);
        throw error;
      }
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Vérifier si l'utilisateur revient d'une redirection OAuth
    getRedirectResult(auth)
      .catch((error) => {
        // Ignorer les erreurs de redirection si l'utilisateur n'a pas utilisé cette méthode
        if (error.code !== "auth/popup-closed-by-user") {
          console.warn("⚠️ Erreur lors de la vérification de redirection:", error);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      // Créer le profil utilisateur dans Firestore
      if (user) {
        // Essayer plusieurs fois avec délai, en attendant que Firestore soit en ligne
        const createProfile = async () => {
          // Attendre un peu pour que Firestore soit prêt
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          for (let i = 0; i < 5; i++) {
            try {
              await ensureUserProfile(user);
              break; // Succès, on sort
            } catch (error: any) {
              console.error(`❌ Erreur tentative ${i + 1}:`, error?.code, error?.message);
              if (i < 4) {
                const delay = 1000 * (i + 1);
                await new Promise(resolve => setTimeout(resolve, delay));
              } else {
                console.error("❌ Échec après 5 tentatives");
              }
            }
          }
        };
        createProfile();
      }
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, usageType?: "business" | "personal" | "both") => {
    if (!auth) {
      throw new Error("Firebase Auth n'est pas initialisé");
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Sauvegarder le type d'utilisation dans le profil utilisateur
    if (userCredential.user) {
      try {
        await ensureUserProfile(userCredential.user, usageType);
      } catch (error) {
        console.error("❌ Erreur lors de la sauvegarde du profil utilisateur:", error);
        // Ne pas bloquer l'inscription si la sauvegarde échoue
      }
    }
  };

  const login = async (email: string, password: string) => {
    if (!auth) {
      throw new Error("Firebase Auth n'est pas initialisé");
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // S'assurer que le profil utilisateur existe dans Firestore (préserve usageType existant)
    if (userCredential.user) {
      try {
        await ensureUserProfile(userCredential.user);
      } catch (error) {
        console.error("❌ Erreur lors de la vérification du profil utilisateur:", error);
        // Ne pas bloquer la connexion si la vérification échoue
      }
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) {
      console.error("❌ Firebase Auth n'est pas initialisé. Vérifiez votre configuration Firebase.");
      console.error("🔍 Diagnostic:");
      console.error("   - Vérifiez que toutes les variables VITE_FIREBASE_* sont définies dans .env");
      console.error("   - Redémarrez le serveur de développement après modification de .env");
      console.error("   - Utilisez diagnoseAuth() dans la console pour plus de détails");
      throw new Error("Firebase Auth n'est pas initialisé. Vérifiez votre configuration dans .env");
    }
    
    try {
      const provider = new GoogleAuthProvider();
      // Ajouter des scopes si nécessaire
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      
      // Vérifier si c'est un nouvel utilisateur et s'il n'a pas de type d'utilisation défini
      if (result.user && db) {
        try {
          const userRef = doc(db, "users", result.user.uid);
          const userDoc = await getDoc(userRef);
        } catch (error) {
          console.warn("⚠️ Impossible de vérifier le type d'utilisation:", error);
        }
      }
    } catch (error: any) {
      console.error("❌ Erreur lors de la connexion Google:", error);
      console.error("   Code:", error.code);
      console.error("   Message:", error.message);
      console.error("   Détails complets:", error);
      
      
      // Détecter l'erreur redirect_uri_mismatch dans le message
      const errorMessage = error.message?.toLowerCase() || "";
      const isRedirectUriMismatch = 
        errorMessage.includes("redirect_uri_mismatch") ||
        errorMessage.includes("redirect uri mismatch") ||
        error.code === "auth/redirect-uri-mismatch";
      
      if (isRedirectUriMismatch) {
        const currentUrl = window.location.origin;
        const redirectUri = `${currentUrl}/__/auth/handler`;
        throw new Error(
          `Erreur redirect_uri_mismatch : L'URI de redirection ne correspond pas. ` +
          `URI utilisée: ${redirectUri}. ` +
          `Ajoutez cette URI dans Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client ID > Authorized redirect URIs. ` +
          `Voir FIX_REDIRECT_URI_MISMATCH.md pour plus de détails.`
        );
      }
      
      // Messages d'erreur plus explicites avec solutions
      if (error.code === "auth/popup-closed-by-user") {
        throw new Error(
          "La fenêtre de connexion a été fermée. " +
          "Si cela se produit souvent, votre navigateur peut bloquer les popups. " +
          "Autorisez les popups pour ce site ou utilisez la méthode de redirection."
        );
      } else if (error.code === "auth/unauthorized-domain") {
        const domain = window.location.hostname;
        throw new Error(
          `Ce domaine (${domain}) n'est pas autorisé. ` +
          `Ajoutez-le dans Firebase Console > Authentication > Settings > Authorized domains. ` +
          `Voir FIX_UNAUTHORIZED_DOMAIN.md pour plus de détails.`
        );
      } else if (error.code === "auth/operation-not-allowed") {
        throw new Error(
          "L'authentification Google n'est pas activée. " +
          "Activez-la dans Firebase Console > Authentication > Sign-in method > Google."
        );
      } else if (error.code === "auth/popup-blocked") {
        throw new Error(
          "La fenêtre popup a été bloquée. " +
          "Autorisez les popups pour ce site dans les paramètres de votre navigateur."
        );
      } else if (error.code === "auth/network-request-failed") {
        throw new Error(
          "Erreur réseau. Vérifiez votre connexion internet et réessayez."
        );
      } else if (error.code === "auth/internal-error") {
        throw new Error(
          "Erreur interne. Vérifiez la configuration Firebase et réessayez. " +
          "Utilisez diagnoseAuth() dans la console pour plus de détails."
        );
      }
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) {
      throw new Error("Firebase Auth n'est pas initialisé");
    }
    await signOut(auth);
  };

  const linkEmailPassword = async (email: string, password: string) => {
    if (!auth || !currentUser) {
      throw new Error("Firebase Auth n'est pas initialisé ou utilisateur non connecté");
    }
    try {
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(currentUser, credential);
    } catch (error: any) {
      console.error("Erreur lors de la liaison email/password:", error);
      if (error.code === "auth/email-already-in-use") {
        throw new Error("Cet email est déjà utilisé par un autre compte.");
      } else if (error.code === "auth/weak-password") {
        throw new Error("Le mot de passe est trop faible. Utilisez au moins 6 caractères.");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("L'adresse email n'est pas valide.");
      }
      throw error;
    }
  };

  const linkGoogleAccount = async () => {
    if (!auth || !currentUser) {
      throw new Error("Firebase Auth n'est pas initialisé ou utilisateur non connecté");
    }
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (!credential) {
        throw new Error("Impossible d'obtenir les credentials Google.");
      }

      // Si c'est le même utilisateur, on lie simplement le credential
      if (result.user.uid === currentUser.uid) {
        // Le compte est déjà lié ou c'est le même compte
        // On vérifie si le provider Google n'est pas déjà présent
        const hasGoogleProvider = currentUser.providerData.some(
          (p) => p.providerId === "google.com"
        );
        if (!hasGoogleProvider) {
          await linkWithCredential(currentUser, credential);
        }
      } else {
        // C'est un compte différent, on essaie de le lier
        // Mais Firebase ne permet pas de lier un compte avec un UID différent
        // On doit d'abord se déconnecter et se reconnecter avec le nouveau compte
        throw new Error("Vous ne pouvez pas lier un compte Google différent. Utilisez le même compte Google ou créez un compte email/mot de passe.");
      }
    } catch (error: any) {
      console.error("Erreur lors de la liaison Google:", error);
      if (error.code === "auth/credential-already-in-use") {
        throw new Error("Ce compte Google est déjà lié à un autre compte.");
      } else if (error.code === "auth/popup-closed-by-user") {
        throw new Error("La fenêtre de connexion a été fermée.");
      } else if (error.code === "auth/requires-recent-login") {
        throw new Error("Pour des raisons de sécurité, vous devez vous reconnecter récemment.");
      }
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!auth || !currentUser) {
      throw new Error("Firebase Auth n'est pas initialisé ou utilisateur non connecté");
    }
    try {
      await deleteUser(currentUser);
    } catch (error: any) {
      console.error("Erreur lors de la suppression du compte:", error);
      if (error.code === "auth/requires-recent-login") {
        throw new Error("Pour des raisons de sécurité, vous devez vous reconnecter récemment avant de supprimer votre compte.");
      }
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    signup,
    login,
    signInWithGoogle,
    logout,
    linkEmailPassword,
    linkGoogleAccount,
    deleteAccount,
  };

  // Toujours rendre les enfants, même pendant le chargement
  // Cela permet aux pages publiques (Privacy, Terms) de fonctionner
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

