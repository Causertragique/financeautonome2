import React, { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { Save, Shield, Bell, Palette, Users, CreditCard, Globe, LogOut, AlertCircle, KeyRound, Download, Trash2, Plus, X, Upload, User, Plug, ExternalLink, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useUsageMode } from "../contexts/UsageModeContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { collection, getDocs, query, where, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { uploadProfilePhoto, deleteProfilePhoto } from "../lib/storage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { useToast } from "@/hooks/use-toast";

// Configurer otplib pour utiliser l'API Web Crypto du navigateur
// Polyfill pour Buffer dans le navigateur
import { Buffer } from "buffer";
if (typeof window !== "undefined") {
  (window as any).Buffer = Buffer;
}

// Configurer otplib pour utiliser l'API Web Crypto
authenticator.options = {
  ...authenticator.options,
  createRandomBytes: (size: number): string => {
    const array = new Uint8Array(size);
    window.crypto.getRandomValues(array);
    // Convertir en base32 (format attendu par otplib)
    return Buffer.from(array).toString("base64");
  },
};

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const { currentUser, logout, linkEmailPassword, linkGoogleAccount, deleteAccount } = useAuth();
  const { usageType, updateUsageType } = useUsageMode();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [showLinkEmailForm, setShowLinkEmailForm] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [linkConfirmPassword, setLinkConfirmPassword] = useState("");
  const [linkError, setLinkError] = useState("");
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: string; type: string; label: string; last4?: string; expiryDate?: string }>>([]);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [profileImageError, setProfileImageError] = useState(false);
  const [isUpdatingUsageType, setIsUpdatingUsageType] = useState(false);
  const [usageTypeError, setUsageTypeError] = useState("");

  // Réinitialiser l'erreur d'image quand la photoURL change
  useEffect(() => {
    setProfileImageError(false);
  }, [currentUser?.photoURL]);

  // Charger l'état du 2FA depuis Firestore
  useEffect(() => {
    const load2FAStatus = async () => {
      if (!currentUser || !db) return;

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setTwoFactorEnabled(userData.twoFactorEnabled || false);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du statut 2FA:", error);
      }
    };

    load2FAStatus();
  }, [currentUser, db]);

  // Charger les modes de paiement
  useEffect(() => {
    const loadPaymentMethods = async () => {
    if (!currentUser || !db) {
        setPaymentMethods([]);
      return;
    }

      try {
        const paymentMethodsRef = collection(db, "users", currentUser.uid, "paymentMethods");
        const snapshot = await getDocs(paymentMethodsRef);
        const methods = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Array<{ id: string; type: string; label: string; last4?: string; expiryDate?: string }>;
        setPaymentMethods(methods);
      } catch (error) {
        console.warn("Erreur lors du chargement des modes de paiement:", error);
        setPaymentMethods([]);
      }
    };

    loadPaymentMethods();
  }, [currentUser, db]);

  const isGoogleAccount = currentUser?.providerData?.some(
    (provider) => provider.providerId === "google.com"
  );
  const hasEmailPassword = currentUser?.providerData?.some(
    (provider) => provider.providerId === "password"
  );

  const handleLinkEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError("");

    if (linkPassword !== linkConfirmPassword) {
      setLinkError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (linkPassword.length < 6) {
      setLinkError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    try {
      await linkEmailPassword(linkEmail || currentUser?.email || "", linkPassword);
      setShowLinkEmailForm(false);
      setLinkEmail("");
      setLinkPassword("");
      setLinkConfirmPassword("");
      alert("Compte email/mot de passe lié avec succès ! Vous pouvez maintenant dissocier Google sans perdre vos données.");
    } catch (error: any) {
      setLinkError(error.message || "Erreur lors de la liaison du compte.");
    }
  };

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    setLinkError("");
    try {
      await linkGoogleAccount();
      alert("Compte Google lié avec succès ! Vous pouvez maintenant dissocier votre autre compte Google sans perdre vos données.");
    } catch (error: any) {
      setLinkError(error.message || "Erreur lors de la liaison du compte Google.");
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    // Vérifier si l'utilisateur a une autre méthode d'authentification
    if (!hasEmailPassword) {
      alert("⚠️ Attention : Vous devez d'abord lier un compte email/mot de passe avant de dissocier Google pour éviter de perdre vos données. Utilisez le bouton 'Lier un compte email/mot de passe' ci-dessous.");
      setShowLinkEmailForm(true);
      return;
    }

    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Erreur lors de la dissociation:", error);
    }
  };

  const handleDownloadData = async () => {
    if (!currentUser || !db) {
      alert("Impossible de télécharger les données. Veuillez vous connecter.");
      return;
    }

    setIsDownloading(true);
    try {
      const userId = currentUser.uid;
      const allData: any = {
        user: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        },
        transactions: [],
        companies: [],
        exportedAt: new Date().toISOString(),
      };

      // Récupérer toutes les transactions
      try {
        // Utiliser une sous-collection : users/{userId}/transactions
        const transactionsRef = collection(db, "users", userId, "transactions");
        const transactionsSnapshot = await getDocs(transactionsRef);
        allData.transactions = transactionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (error) {
        console.error("Erreur lors de la récupération des transactions:", error);
      }

      // Récupérer toutes les entreprises
      try {
        const companiesRef = collection(db, "Users", userId, "data", "entreprise", "companies");
        const companiesSnapshot = await getDocs(companiesRef);
        allData.companies = companiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (error) {
        console.error("Erreur lors de la récupération des entreprises:", error);
      }

      // Créer un fichier JSON et le télécharger
      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mes-donnees-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert("✅ Vos données ont été téléchargées avec succès !");
    } catch (error) {
      console.error("Erreur lors du téléchargement des données:", error);
      alert("❌ Erreur lors du téléchargement des données. Veuillez réessayer.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser || !db) {
      alert("Impossible de supprimer le compte. Veuillez vous connecter.");
      return;
    }

    if (deleteConfirmText !== "SUPPRIMER") {
      alert("Veuillez taper 'SUPPRIMER' en majuscules pour confirmer.");
      return;
    }

    setIsDeleting(true);
    try {
      const userId = currentUser.uid;

      // Supprimer toutes les transactions
      try {
        // Utiliser une sous-collection : users/{userId}/transactions
        const transactionsRef = collection(db, "users", userId, "transactions");
        const transactionsSnapshot = await getDocs(transactionsRef);
        const deletePromises = transactionsSnapshot.docs.map((docSnapshot) =>
          deleteDoc(doc(db, "users", userId, "transactions", docSnapshot.id))
        );
        await Promise.all(deletePromises);
      } catch (error) {
        console.error("Erreur lors de la suppression des transactions:", error);
      }

      // Supprimer toutes les entreprises
      try {
        const companiesRef = collection(db, "Users", userId, "data", "entreprise", "companies");
        const companiesSnapshot = await getDocs(companiesRef);
        const deletePromises = companiesSnapshot.docs.map((docSnapshot) =>
          deleteDoc(doc(db, "Users", userId, "data", "entreprise", "companies", docSnapshot.id))
        );
        await Promise.all(deletePromises);
      } catch (error) {
        console.error("Erreur lors de la suppression des entreprises:", error);
      }

      // Supprimer le compte utilisateur Firebase
      await deleteAccount();

      // Déconnecter et rediriger
      await logout();
      navigate("/login");
      alert("✅ Votre compte et toutes vos données ont été supprimés avec succès.");
    } catch (error: any) {
      console.error("Erreur lors de la suppression du compte:", error);
      alert(error.message || "❌ Erreur lors de la suppression du compte. Veuillez réessayer.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
    }
  };

  // Réinitialiser l'erreur d'image quand la photoURL change
  useEffect(() => {
    setProfileImageError(false);
  }, [currentUser?.photoURL]);

  // Charger l'état du 2FA depuis Firestore
  useEffect(() => {
    const load2FAStatus = async () => {
      if (!currentUser || !db) return;

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setTwoFactorEnabled(data.twoFactorEnabled || false);
        }
      } catch (error: any) {
        // Ignorer les erreurs de connexion offline (Firestore gère le cache)
        if (error?.code !== "unavailable" && error?.code !== "failed-precondition") {
          console.error("Erreur lors du chargement du statut 2FA:", error);
        }
      }
    };

    load2FAStatus();
  }, [currentUser, db]);

  // Charger les modes de paiement depuis l'API
  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!currentUser) return;

      try {
        const response = await fetch(`/api/payment-methods?userId=${currentUser.uid}`);
        if (!response.ok) {
          // Si l'erreur est 500 ou autre, essayer de récupérer le message d'erreur
          let errorMessage = "Erreur lors du chargement des modes de paiement";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // Si la réponse n'est pas du JSON, utiliser le message par défaut
          }
          
          // Ne pas lancer d'erreur pour les erreurs réseau ou serveur temporaires
          // Juste logger et continuer avec une liste vide
          console.warn("Impossible de charger les modes de paiement:", errorMessage);
          setPaymentMethods([]);
          return;
        }
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      } catch (error: any) {
        // Erreur réseau (fetch failed) - ne pas spammer la console
        // Juste initialiser avec une liste vide
        if (error.name === "TypeError" && error.message.includes("fetch")) {
          console.warn("Erreur réseau lors du chargement des modes de paiement. Le serveur est peut-être indisponible.");
        } else {
        console.error("Erreur lors du chargement des modes de paiement:", error);
        }
        setPaymentMethods([]);
      }
    };

    loadPaymentMethods();
  }, [currentUser]);

  const handleAddPaymentMethod = async (type: string) => {
    if (!currentUser) {
      alert("Erreur : Vous devez être connecté pour ajouter un mode de paiement.");
      return;
    }

    try {
      const response = await fetch("/api/payment-methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          type: type,
          label: getPaymentMethodLabel(type),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'ajout");
      }

      // Recharger la liste
      const listResponse = await fetch(`/api/payment-methods?userId=${currentUser.uid}`);
      if (listResponse.ok) {
        const data = await listResponse.json();
        setPaymentMethods(data.paymentMethods || []);
      }

      setShowAddPaymentMethod(false);
      setSelectedPaymentType("");
      alert("Mode de paiement ajouté avec succès !");
    } catch (error: any) {
      console.error("Erreur lors de l'ajout du mode de paiement:", error);
      alert(`Erreur lors de l'ajout du mode de paiement: ${error.message || "Erreur inconnue"}. Veuillez réessayer.`);
    }
  };

  const handleRemovePaymentMethod = async (methodId: string) => {
    if (!currentUser) return;

    if (!confirm("Êtes-vous sûr de vouloir supprimer ce mode de paiement ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/payment-methods/${methodId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.uid,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      // Recharger la liste
      const listResponse = await fetch(`/api/payment-methods?userId=${currentUser.uid}`);
      if (listResponse.ok) {
        const data = await listResponse.json();
        setPaymentMethods(data.paymentMethods || []);
      }

      alert("Mode de paiement supprimé avec succès !");
    } catch (error: any) {
      console.error("Erreur lors de la suppression du mode de paiement:", error);
      alert(`Erreur lors de la suppression du mode de paiement: ${error.message || "Erreur inconnue"}. Veuillez réessayer.`);
    }
  };

  const getPaymentMethodLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      card: "Carte de crédit",
      paypal: "PayPal",
      stripe: "Stripe",
      applepay: "Apple Pay",
      googlepay: "Google Pay",
    };
    return labels[type] || type;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      setPhotoError("Le fichier doit être une image");
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("L'image ne doit pas dépasser 5MB");
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoError("");

    try {
      // Sauvegarder l'ancienne photo URL pour la supprimer après
      const oldPhotoURL = currentUser.photoURL;

      console.log("📤 Début de l'upload de la photo de profil...");
      
      // Uploader la nouvelle photo
      const newPhotoURL = await uploadProfilePhoto(file);
      
      if (!newPhotoURL) {
        throw new Error("Erreur lors de l'upload de la photo. Vérifiez la console pour plus de détails.");
      }

      console.log("✅ Photo uploadée, mise à jour du profil...");

      // Mettre à jour le profil utilisateur
      await updateProfile(currentUser, {
        photoURL: newPhotoURL
      });

      console.log("✅ Profil mis à jour avec succès");

      // Supprimer l'ancienne photo si elle existe et vient de Firebase Storage
      if (oldPhotoURL) {
        console.log("🗑️ Suppression de l'ancienne photo...");
        await deleteProfilePhoto(oldPhotoURL);
      }

      // Réinitialiser l'erreur d'image et recharger la page pour mettre à jour l'affichage
      setProfileImageError(false);
      alert("✅ Photo de profil mise à jour avec succès !");
      window.location.reload();
    } catch (error: any) {
      console.error("❌ Erreur lors de la mise à jour de la photo de profil:", error);
      console.error("❌ Code d'erreur:", error?.code);
      console.error("❌ Message:", error?.message);
      
      let errorMessage = "Erreur lors de la mise à jour de la photo de profil";
      if (error?.code === 'storage/unauthorized') {
        errorMessage = "Vous n'avez pas l'autorisation d'uploader cette photo. Vérifiez les règles de sécurité Firebase Storage.";
      } else if (error?.code === 'storage/quota-exceeded') {
        errorMessage = "Le quota de stockage est dépassé.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setPhotoError(errorMessage);
    } finally {
      setIsUploadingPhoto(false);
      // Réinitialiser l'input
      e.target.value = "";
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case "card":
        return <CreditCard className="w-5 h-5" />;
      case "paypal":
        return (
          <img 
            src="/PayPal.png" 
            alt="PayPal" 
            className="h-6 w-auto object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        );
      case "stripe":
        return <img src="/Stripe.png" alt="Stripe" className="h-5 w-auto object-contain" />;
      case "applepay":
        return <span className="text-black font-bold text-sm">Apple Pay</span>;
      case "googlepay":
        return <span className="text-gray-800 font-bold text-sm">Google Pay</span>;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const isApplePayAvailable = () => {
    if (typeof window === "undefined") return false;
    return "ApplePaySession" in window;
  };

  const isGooglePayAvailable = () => {
    if (typeof window === "undefined") return false;
    return "google" in window && (window as any).google?.payments?.api?.PaymentsClient !== undefined;
  };

  const handleEnable2FA = async () => {
    if (!currentUser || !db) return;

    setTwoFactorError("");
    setIsVerifying(false);

    try {
      // Générer un secret TOTP
      const secret = authenticator.generateSecret();
      setTwoFactorSecret(secret);

      // Créer l'URI pour le QR code
      const serviceName = "Finance Autonome";
      const accountName = currentUser.email || currentUser.uid;
      const otpAuthUrl = authenticator.keyuri(accountName, serviceName, secret);

      // Générer le QR code
      const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);
      setQrCodeUrl(qrCodeDataUrl);
      setShow2FASetup(true);
    } catch (error) {
      console.error("Erreur lors de la génération du secret 2FA:", error);
      setTwoFactorError("Erreur lors de la génération du code QR. Veuillez réessayer.");
    }
  };

  const handleVerifyAndEnable2FA = async () => {
    if (!currentUser || !db || !twoFactorSecret || !verificationCode) {
      setTwoFactorError("Veuillez entrer le code de vérification.");
      return;
    }

    setIsVerifying(true);
    setTwoFactorError("");

    try {
      // Vérifier le code TOTP
      const isValid = authenticator.verify({
        token: verificationCode,
        secret: twoFactorSecret,
      });

      if (!isValid) {
        setTwoFactorError("Code invalide. Veuillez réessayer.");
        setIsVerifying(false);
        return;
      }

      // Stocker le secret dans Firestore
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, {
        twoFactorEnabled: true,
        twoFactorSecret: twoFactorSecret, // En production, chiffrez ce secret
      }, { merge: true });

      setTwoFactorEnabled(true);
      setShow2FASetup(false);
      setVerificationCode("");
      setQrCodeUrl("");
      setTwoFactorSecret("");
      alert("✅ Authentification à double facteur activée avec succès !");
    } catch (error: any) {
      console.error("Erreur lors de la vérification du code:", error);
      setTwoFactorError(error.message || "Erreur lors de la vérification. Veuillez réessayer.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!currentUser || !db) return;

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, {
        twoFactorEnabled: false,
        twoFactorSecret: "",
      }, { merge: true });

      setTwoFactorEnabled(false);
      setShow2FASetup(false);
      setTwoFactorSecret("");
      setQrCodeUrl("");
      alert("✅ Authentification à double facteur désactivée.");
    } catch (error) {
      console.error("Erreur lors de la désactivation du 2FA:", error);
      alert("❌ Erreur lors de la désactivation. Veuillez réessayer.");
    }
  };

  const tabs = [
    { id: "general", label: t("settings.general"), icon: <Palette className="w-5 h-5" /> },
    { id: "account", label: t("settings.account"), icon: <Users className="w-5 h-5" /> },
    {
      id: "notifications",
      label: t("settings.notifications"),
      icon: <Bell className="w-5 h-5" />,
    },
    { id: "billing", label: t("settings.billing"), icon: <CreditCard className="w-5 h-5" /> },
    { id: "security", label: t("settings.security"), icon: <Shield className="w-5 h-5" /> },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t("settings.title")}</h1>
        <p className="text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border border-border p-2 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {tab.icon}
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            {activeTab === "general" && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  {t("settings.generalSettings")}
                </h2>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="settings-language" className="text-sm font-medium text-foreground block mb-2">
                      {t("settings.language")}
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      {t("settings.languageDescription")}
                    </p>
                    <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-xl p-4">
                      <Globe className="w-5 h-5 text-primary" />
                      <select
                        id="settings-language"
                        name="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as "fr" | "en")}
                        className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                        aria-label={t("settings.language") || "Langue"}
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="settings-currency" className="text-sm font-medium text-foreground block mb-2">
                      {t("settings.defaultCurrency")}
                    </label>
                    <select id="settings-currency" name="currency" className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>{t("settings.currencyCAD")}</option>
                      <option>{t("settings.currencyUSD")}</option>
                      <option>{t("settings.currencyEUR")}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="settings-fiscal-year" className="text-sm font-medium text-foreground block mb-2">
                      {t("settings.fiscalYearStart")}
                    </label>
                    <select id="settings-fiscal-year" name="fiscalYear" className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>{t("settings.monthJanuary")}</option>
                      <option>{t("settings.monthApril")}</option>
                      <option>{t("settings.monthJuly")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      {t("settings.theme")}
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input id="theme-light" type="radio" name="theme" value="light" defaultChecked />
                        <span className="text-sm text-foreground">{t("settings.themeLight")}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input id="theme-dark" type="radio" name="theme" value="dark" />
                        <span className="text-sm text-foreground">{t("settings.themeDark")}</span>
                      </label>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium">
                    <Save className="w-5 h-5" />
                    <span>{t("settings.save")}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "account" && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  {t("settings.accountSettings")}
                </h2>
                <div className="space-y-6">
                  {/* Type d'utilisation */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Type d'utilisation de Nova Finance
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Choisissez comment vous utilisez Nova Finance. Vous pouvez modifier ce choix à tout moment.
                    </p>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                        <input
                          type="radio"
                          name="usageType"
                          value="business"
                          checked={usageType === "business"}
                          onChange={async () => {
                            if (usageType === "business") return;
                            setIsUpdatingUsageType(true);
                            setUsageTypeError("");
                            try {
                              await updateUsageType("business");
                              alert("✅ Type d'utilisation mis à jour avec succès ! La page va se recharger.");
                              window.location.reload();
                            } catch (error: any) {
                              setUsageTypeError(error.message || "Erreur lors de la mise à jour");
                            } finally {
                              setIsUpdatingUsageType(false);
                            }
                          }}
                          disabled={isUpdatingUsageType}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-foreground">Votre entreprise</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Gestion financière pour votre entreprise
                          </p>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                        <input
                          type="radio"
                          name="usageType"
                          value="personal"
                          checked={usageType === "personal"}
                          onChange={async () => {
                            if (usageType === "personal") return;
                            setIsUpdatingUsageType(true);
                            setUsageTypeError("");
                            try {
                              await updateUsageType("personal");
                              alert("✅ Type d'utilisation mis à jour avec succès ! La page va se recharger.");
                              window.location.reload();
                            } catch (error: any) {
                              setUsageTypeError(error.message || "Erreur lors de la mise à jour");
                            } finally {
                              setIsUpdatingUsageType(false);
                            }
                          }}
                          disabled={isUpdatingUsageType}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-foreground">Vos finances personnelles</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Gestion financière personnelle
                          </p>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                        <input
                          type="radio"
                          name="usageType"
                          value="both"
                          checked={usageType === "both"}
                          onChange={async () => {
                            if (usageType === "both") return;
                            setIsUpdatingUsageType(true);
                            setUsageTypeError("");
                            try {
                              await updateUsageType("both");
                              alert("✅ Type d'utilisation mis à jour avec succès ! La page va se recharger.");
                              window.location.reload();
                            } catch (error: any) {
                              setUsageTypeError(error.message || "Erreur lors de la mise à jour");
                            } finally {
                              setIsUpdatingUsageType(false);
                            }
                          }}
                          disabled={isUpdatingUsageType}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-foreground">Les deux</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Gestion financière pour votre entreprise et vos finances personnelles
                          </p>
                        </div>
                      </label>
                    </div>
                    {usageTypeError && (
                      <p className="text-xs text-destructive mt-2">{usageTypeError}</p>
                    )}
                    {isUpdatingUsageType && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Mise à jour en cours...</span>
                      </div>
                    )}
                    {usageType && (
                      <div className="mt-3 p-3 border border-primary/50 rounded-lg bg-primary/10">
                        <p className="text-xs text-foreground">
                          <strong>Type actuel :</strong> {
                            usageType === "business" ? "Entreprise" :
                            usageType === "personal" ? "Finance personnelle" :
                            "Les deux"
                          }
                        </p>
                        {usageType === "both" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Vous pouvez basculer entre les deux modes depuis la sidebar.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Photo de profil */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      {t("settings.profilePhoto") || "Photo de profil"}
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {currentUser?.photoURL && !profileImageError ? (
                          <img
                            src={currentUser.photoURL}
                            alt={currentUser.displayName || "Profil"}
                            className="w-20 h-20 rounded-full object-cover border-2 border-border"
                            onError={() => setProfileImageError(true)}
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-border flex items-center justify-center">
                            <User className="w-10 h-10 text-primary" />
                          </div>
                        )}
                        {isUploadingPhoto && (
                          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <label
                          htmlFor="profile-photo-upload"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploadingPhoto ? (
                            <>
                              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                              <span>Upload en cours...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>{currentUser?.photoURL ? t("settings.changePhoto") || "Changer la photo" : t("settings.uploadPhoto") || "Télécharger une photo"}</span>
                            </>
                          )}
                        </label>
                        <input
                          id="profile-photo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={isUploadingPhoto}
                          className="hidden"
                        />
                        {photoError && (
                          <p className="text-xs text-destructive mt-2">{photoError}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("settings.photoHint") || "Formats acceptés: JPG, PNG, GIF. Taille max: 5MB"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="account-full-name" className="text-sm font-medium text-foreground block mb-2">
                      {t("settings.fullName")}
                    </label>
                    <input
                      id="account-full-name"
                      name="fullName"
                      type="text"
                      defaultValue={currentUser?.displayName || ""}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="account-email" className="text-sm font-medium text-foreground block mb-2">
                      {t("settings.email")}
                    </label>
                    <input
                      id="account-email"
                      name="email"
                      type="email"
                      defaultValue={currentUser?.email || ""}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={isGoogleAccount}
                    />
                  </div>
                  <div>
                    <label htmlFor="account-phone" className="text-sm font-medium text-foreground block mb-2">
                      {t("settings.phone")}
                    </label>
                    <input
                      id="account-phone"
                      name="phone"
                      type="tel"
                      defaultValue=""
                      placeholder={t("settings.phone") || "Téléphone"}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium">
                    <Save className="w-5 h-5" />
                    <span>{t("settings.updateAccount")}</span>
                  </button>
                  {currentUser && (
                    <div className="p-5 border border-border rounded-xl bg-gradient-to-br from-card via-card to-secondary/20 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          {isGoogleAccount ? (
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                                  <svg className="w-7 h-7" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                  </svg>
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              </div>
                              <div>
                                <p className="text-base font-semibold text-foreground">
                                  Connecté avec Google
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {currentUser?.email}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                                <Users className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <p className="text-base font-semibold text-foreground">
                                  {t("settings.emailPassword") || "Email et mot de passe"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {currentUser?.email}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        {isGoogleAccount && (
                          <button
                            onClick={() => {
                              if (!hasEmailPassword) {
                                setShowLinkEmailForm(true);
                                alert("⚠️ Vous devez d'abord lier un compte email/mot de passe avant de pouvoir dissocier Google. Cela protège vos données.");
                              } else {
                                setShowUnlinkConfirm(true);
                              }
                            }}
                            disabled={!hasEmailPassword}
                            className={`flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg transition-all duration-200 ${
                              hasEmailPassword
                                ? "text-foreground hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
                                : "text-muted-foreground opacity-50 cursor-not-allowed"
                            }`}
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Dissocier</span>
                          </button>
                        )}
                      </div>
                      {!hasEmailPassword && isGoogleAccount && (
                        <div className="mt-4 p-4 border border-blue-500/50 rounded-lg bg-blue-500/10">
                          <div className="flex items-start gap-2 mb-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground mb-1">
                                Protégez vos données
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Pour éviter de perdre vos données lors d'un changement de méthode d'authentification, liez d'abord un autre compte (email/mot de passe ou un autre compte Google) à votre compte actuel.
                              </p>
                            </div>
                          </div>
                          {!showLinkEmailForm ? (
                            <div className="space-y-2">
                              <button
                                onClick={() => setShowLinkEmailForm(true)}
                                className="w-full px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                              >
                                Lier un compte email/mot de passe
                              </button>
                              <button
                                onClick={handleLinkGoogle}
                                disabled={isLinkingGoogle}
                                className="w-full px-4 py-2 text-sm border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {isLinkingGoogle ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <span>Connexion en cours...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    <span>Lier un autre compte Google</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <form onSubmit={handleLinkEmailPassword} className="space-y-3">
                              <div>
                                <label htmlFor="link-email" className="text-xs font-medium text-foreground block mb-1">
                                  Email
                                </label>
                                <input
                                  id="link-email"
                                  type="email"
                                  value={linkEmail || currentUser?.email || ""}
                                  onChange={(e) => setLinkEmail(e.target.value)}
                                  disabled={!!currentUser?.email}
                                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                                  required
                                />
                              </div>
                              <div>
                                <label htmlFor="link-password" className="text-xs font-medium text-foreground block mb-1">
                                  Mot de passe
                                </label>
                                <input
                                  id="link-password"
                                  type="password"
                                  value={linkPassword}
                                  onChange={(e) => setLinkPassword(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                  required
                                  minLength={6}
                                />
                              </div>
                              <div>
                                <label htmlFor="link-confirm-password" className="text-xs font-medium text-foreground block mb-1">
                                  Confirmer le mot de passe
                                </label>
                                <input
                                  id="link-confirm-password"
                                  type="password"
                                  value={linkConfirmPassword}
                                  onChange={(e) => setLinkConfirmPassword(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                  required
                                  minLength={6}
                                />
                              </div>
                              {linkError && (
                                <p className="text-xs text-destructive">{linkError}</p>
                              )}
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                                >
                                  Lier le compte
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowLinkEmailForm(false);
                                    setLinkError("");
                                  }}
                                  className="flex-1 px-3 py-2 text-sm border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
                                >
                                  Annuler
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      )}
                      {hasEmailPassword && (
                        <div className="mt-4 p-3 border border-green-500/50 rounded-lg bg-green-500/10">
                          <p className="text-xs text-muted-foreground mb-2">
                            ✓ Compte email/mot de passe lié. Vos données sont protégées.
                          </p>
                        </div>
                      )}
                      {showUnlinkConfirm && (
                        <div className="mt-4 p-3 border border-yellow-500/50 rounded-lg bg-yellow-500/10">
                          <div className="flex items-start gap-2 mb-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground mb-1">
                                {t("settings.unlinkWarning") || "Attention"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {hasEmailPassword 
                                  ? "La dissociation de votre compte Google vous déconnectera. Vous pourrez vous reconnecter avec votre compte email/mot de passe. Vos données seront conservées car elles sont liées à votre compte."
                                  : "Vous devez d'abord lier un compte email/mot de passe pour éviter de perdre vos données."}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {hasEmailPassword ? (
                              <>
                                <button
                                  onClick={handleUnlinkGoogle}
                                  className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                                >
                                  {t("settings.confirmUnlink") || "Confirmer la dissociation"}
                                </button>
                                <button
                                  onClick={() => setShowUnlinkConfirm(false)}
                                  className="flex-1 px-3 py-2 text-sm border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
                                >
                                  {t("settings.cancel") || "Annuler"}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setShowUnlinkConfirm(false);
                                  setShowLinkEmailForm(true);
                                }}
                                className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                              >
                                Lier un compte email/mot de passe d'abord
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  {t("settings.notificationPreferences")}
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      title: t("settings.taxDeadlineReminders"),
                      description: t("settings.taxDeadlineDesc"),
                    },
                    {
                      title: t("settings.monthlyReports"),
                      description: t("settings.monthlyReportsDesc"),
                    },
                    {
                      title: t("settings.largeTransactions"),
                      description: t("settings.largeTransactionsDesc"),
                    },
                    {
                      title: t("settings.systemUpdates"),
                      description: t("settings.systemUpdatesDesc"),
                    },
                  ].map((notif, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {notif.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {notif.description}
                        </p>
                      </div>
                      <input 
                        id={`notification-${idx}`}
                        name={`notification-${idx}`}
                        type="checkbox" 
                        defaultChecked 
                        className="w-5 h-5"
                        aria-label={notif.title}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}


            {activeTab === "billing" && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  {t("settings.billingSubscription")}
                </h2>
                <div className="space-y-6">
                  {currentUser ? (
                    <>
                      <div className="p-4 border border-border rounded-lg bg-secondary/30">
                        <p className="text-sm text-muted-foreground mb-1">
                          {t("settings.currentPlan")}
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {t("settings.professional")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          $49/month billed annually
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-foreground">
                          {t("settings.paymentMethod")}
                        </h3>
                          <button
                            onClick={() => setShowAddPaymentMethod(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
                            aria-label="Ajouter un mode de paiement"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Ajouter</span>
                          </button>
                        </div>
                        {paymentMethods.length > 0 ? (
                          <div className="space-y-3">
                            {paymentMethods.map((method) => (
                              <div
                                key={method.id}
                                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/30 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                    {getPaymentMethodIcon(method.type)}
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {method.label}
                                    </p>
                                    {method.last4 && (
                                      <p className="text-sm text-muted-foreground">
                                        •••• {method.last4}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemovePaymentMethod(method.id)}
                                  className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                                  aria-label={`Supprimer ${method.label}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                        <div className="p-4 border border-border rounded-lg">
                            <div className="flex flex-col items-center justify-center gap-3 py-4">
                              <CreditCard className="w-8 h-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                                Aucun mode de paiement enregistré
                          </p>
                        </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-4 border border-border rounded-lg bg-secondary/30">
                      <p className="text-sm text-muted-foreground">
                        {t("settings.loginRequired") || "Veuillez vous connecter pour voir vos informations de facturation"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  {t("settings.security")}
                </h2>
                <div className="space-y-6">
                  {currentUser ? (
                    <>
                      {!isGoogleAccount && (
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-4">
                            {t("settings.changePassword")}
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label htmlFor="current-password" className="text-sm font-medium text-foreground block mb-2">
                                {t("settings.currentPassword")}
                              </label>
                              <input
                                id="current-password"
                                name="currentPassword"
                                type="password"
                                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label htmlFor="new-password" className="text-sm font-medium text-foreground block mb-2">
                                {t("settings.newPassword")}
                              </label>
                              <input
                                id="new-password"
                                name="newPassword"
                                type="password"
                                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <label htmlFor="confirm-password" className="text-sm font-medium text-foreground block mb-2">
                                {t("settings.confirmPassword")}
                              </label>
                              <input
                                id="confirm-password"
                                name="confirmPassword"
                                type="password"
                                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium">
                              <Save className="w-5 h-5" />
                              <span>{t("settings.updatePassword")}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-4 border border-border rounded-lg bg-secondary/30">
                      <p className="text-sm text-muted-foreground">
                        {t("settings.loginRequired") || "Veuillez vous connecter pour accéder aux paramètres de sécurité"}
                      </p>
                    </div>
                  )}
                  <div className="pt-6 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Détection d'anomalies
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Analysez vos transactions pour détecter les anomalies et les erreurs potentielles dans vos données financières.
                    </p>
                    <button
                      onClick={() => navigate("/anomalies")}
                      className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
                    >
                      <AlertCircle className="w-5 h-5" />
                      <span>Voir les anomalies</span>
                    </button>
                  </div>
                  <div className="pt-6 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      {t("settings.twoFactorAuth")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("settings.twoFactorDesc") || "Renforcez la sécurité de votre compte en activant l'authentification à double facteur avec une application d'authentification (Google Authenticator, Authy, etc.). C'est gratuit et plus sécurisé que les SMS."}
                    </p>
                    {currentUser && (
                      <>
                        {twoFactorEnabled ? (
                          <div className="space-y-4">
                            <div className="p-4 border border-green-500/50 rounded-lg bg-green-500/10">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Shield className="w-5 h-5 text-green-600" />
                                  <div>
                                    <p className="text-sm font-medium text-foreground">
                                      Authentification à double facteur activée
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      Utilisez votre application d'authentification pour générer des codes
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={handleDisable2FA}
                                  className="px-4 py-2 text-sm border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
                                >
                                  Désactiver
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {!show2FASetup ? (
                              <button
                                onClick={handleEnable2FA}
                                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
                              >
                                <Shield className="w-5 h-5" />
                                <span>{t("settings.enable2FA") || "Activer l'authentification à double facteur"}</span>
                              </button>
                            ) : (
                              <div className="space-y-4">
                                <div className="p-4 border border-border rounded-lg bg-secondary/30">
                                  <p className="text-sm font-medium text-foreground mb-3">
                                    Étape 1 : Scannez le QR code
                                  </p>
                                  <p className="text-xs text-muted-foreground mb-4">
                                    Utilisez une application d'authentification (Google Authenticator, Authy, Microsoft Authenticator, etc.) pour scanner ce code QR.
                                  </p>
                                  {qrCodeUrl && (
                                    <div className="flex justify-center mb-4">
                                      <img src={qrCodeUrl} alt="QR Code 2FA" className="w-48 h-48 border border-border rounded-lg bg-white p-2" />
                                    </div>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    Si vous ne pouvez pas scanner le QR code, vous pouvez entrer manuellement le secret dans votre application d'authentification.
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground mb-3">
                                    Étape 2 : Entrez le code de vérification
                                  </p>
                                  <label htmlFor="2fa-verification-code" className="text-sm font-medium text-foreground block mb-2">
                                    Code à 6 chiffres
                                  </label>
                                  <input
                                    id="2fa-verification-code"
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    placeholder="123456"
                                    maxLength={6}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest font-mono"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Entrez le code à 6 chiffres affiché dans votre application d'authentification
                                  </p>
                                </div>
                                {twoFactorError && (
                                  <p className="text-xs text-destructive">{twoFactorError}</p>
                                )}
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleVerifyAndEnable2FA}
                                    disabled={isVerifying || verificationCode.length !== 6}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isVerifying ? (
                                      <>
                                        <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                                        <span>Vérification en cours...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Shield className="w-5 h-5" />
                                        <span>Activer le 2FA</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShow2FASetup(false);
                                      setVerificationCode("");
                                      setQrCodeUrl("");
                                      setTwoFactorSecret("");
                                      setTwoFactorError("");
                                    }}
                                    disabled={isVerifying}
                                    className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {currentUser && (
                    <>
                      <div className="pt-6 border-t border-border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                          Télécharger vos données
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Téléchargez une copie de toutes vos données (transactions, entreprises, etc.) au format JSON.
                        </p>
                        <button
                          onClick={handleDownloadData}
                          disabled={isDownloading}
                          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDownloading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                              <span>Téléchargement en cours...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-5 h-5" />
                              <span>Télécharger mes données</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="pt-6 border-t border-border">
                        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
                          <div className="flex items-start gap-3 mb-4">
                            <AlertCircle className="w-6 h-6 text-destructive mt-0.5" />
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-destructive mb-2">
                                Zone de danger
                              </h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                La suppression de votre compte est irréversible. Toutes vos données (transactions, entreprises, etc.) seront définitivement supprimées. Cette action ne peut pas être annulée.
                              </p>
                              {!showDeleteConfirm ? (
                                <button
                                  onClick={() => setShowDeleteConfirm(true)}
                                  className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                                >
                                  <Trash2 className="w-5 h-5" />
                                  <span>Supprimer mon compte</span>
                                </button>
                              ) : (
                                <div className="space-y-4">
                                  <div>
                                    <label htmlFor="delete-confirm" className="text-sm font-medium text-foreground block mb-2">
                                      Pour confirmer, tapez <span className="font-bold text-destructive">SUPPRIMER</span> en majuscules :
                                    </label>
                                    <input
                                      id="delete-confirm"
                                      type="text"
                                      value={deleteConfirmText}
                                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                                      placeholder="SUPPRIMER"
                                      className="w-full px-3 py-2 border border-destructive/50 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={handleDeleteAccount}
                                      disabled={isDeleting || deleteConfirmText !== "SUPPRIMER"}
                                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isDeleting ? (
                                        <>
                                          <div className="w-5 h-5 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin"></div>
                                          <span>Suppression en cours...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Trash2 className="w-5 h-5" />
                                          <span>Confirmer la suppression</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteConfirmText("");
                                      }}
                                      disabled={isDeleting}
                                      className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'ajout de mode de paiement */}
      <Dialog open={showAddPaymentMethod} onOpenChange={setShowAddPaymentMethod}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un mode de paiement</DialogTitle>
            <DialogDescription>
              Choisissez le type de mode de paiement que vous souhaitez ajouter
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <button
              onClick={() => handleAddPaymentMethod("card")}
              className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Carte de crédit</p>
                <p className="text-sm text-muted-foreground">Visa, Mastercard, etc.</p>
              </div>
            </button>

            <button
              onClick={() => handleAddPaymentMethod("paypal")}
              className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <img 
                  src="/PayPal.png" 
                  alt="PayPal" 
                  className="h-7 w-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">PayPal</p>
                <p className="text-sm text-muted-foreground">Payer avec votre compte PayPal</p>
              </div>
            </button>

            <button
              onClick={() => handleAddPaymentMethod("stripe")}
              className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <img src="/Stripe.png" alt="Stripe" className="h-6 w-auto object-contain" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Stripe</p>
                <p className="text-sm text-muted-foreground">Paiement sécurisé via Stripe</p>
              </div>
            </button>

            {isApplePayAvailable() && (
              <button
                onClick={() => handleAddPaymentMethod("applepay")}
                className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <span className="text-black font-bold text-sm">Apple Pay</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Apple Pay</p>
                  <p className="text-sm text-muted-foreground">Payer avec Apple Pay</p>
                </div>
              </button>
            )}

            {isGooglePayAvailable() && (
              <button
                onClick={() => handleAddPaymentMethod("googlepay")}
                className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <span className="text-gray-800 font-bold text-sm">Google Pay</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Google Pay</p>
                  <p className="text-sm text-muted-foreground">Payer avec Google Pay</p>
                </div>
              </button>
            )}
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowAddPaymentMethod(false)}
              className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
            >
              Annuler
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
