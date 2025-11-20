/**
 * Script de diagnostic pour l'authentification Firebase
 * Utilisez cette fonction dans la console du navigateur pour diagnostiquer les problèmes
 */

import { auth, app } from "@/lib/firebase";

export function diagnoseAuth() {
  const diagnostics: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Vérifier les variables d'environnement
  diagnostics.push("=== VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT ===");
  
  const requiredVars = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
  ];

  requiredVars.forEach((varName) => {
    const value = import.meta.env[varName];
    if (!value || value === "") {
      errors.push(`❌ ${varName} est manquant ou vide`);
    } else {
      diagnostics.push(`✅ ${varName}: présent`);
    }
  });

  // 2. Vérifier l'initialisation Firebase
  diagnostics.push("\n=== VÉRIFICATION DE L'INITIALISATION FIREBASE ===");
  
  try {
    if (!app) {
      errors.push("❌ Firebase App n'est pas initialisé");
    } else {
      diagnostics.push("✅ Firebase App initialisé");
    }

    if (!auth) {
      errors.push("❌ Firebase Auth n'est pas initialisé");
    } else {
      diagnostics.push("✅ Firebase Auth initialisé");
      
      // Vérifier la configuration
      const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
      if (authDomain) {
        diagnostics.push(`✅ Auth Domain: ${authDomain}`);
      } else {
        warnings.push("⚠️ Auth Domain non défini");
      }
    }

    // 3. Vérifier le domaine actuel
    diagnostics.push("\n=== VÉRIFICATION DU DOMAINE ACTUEL ===");
    const currentDomain = window.location.hostname;
    diagnostics.push(`📍 Domaine actuel: ${currentDomain}`);
    
    if (currentDomain === "localhost" || currentDomain === "127.0.0.1") {
      diagnostics.push("ℹ️ Mode développement détecté");
      warnings.push("⚠️ Assurez-vous que 'localhost' est dans les domaines autorisés Firebase");
    } else {
      warnings.push(`⚠️ Assurez-vous que '${currentDomain}' est dans les domaines autorisés Firebase`);
    }

    // 4. Vérifier l'état de l'authentification
    diagnostics.push("\n=== ÉTAT DE L'AUTHENTIFICATION ===");
    if (auth) {
      const currentUser = auth.currentUser;
      if (currentUser) {
        diagnostics.push(`✅ Utilisateur connecté: ${currentUser.email || currentUser.uid}`);
        diagnostics.push(`   - UID: ${currentUser.uid}`);
        diagnostics.push(`   - Email vérifié: ${currentUser.emailVerified ? "Oui" : "Non"}`);
        diagnostics.push(`   - Providers: ${currentUser.providerData.map(p => p.providerId).join(", ")}`);
      } else {
        diagnostics.push("ℹ️ Aucun utilisateur connecté");
      }
    }
  } catch (error: any) {
    errors.push(`❌ Erreur lors de la vérification Firebase: ${error.message}`);
  }

  // Résumé
  console.log("\n" + "=".repeat(60));
  console.log("DIAGNOSTIC D'AUTHENTIFICATION FIREBASE");
  console.log("=".repeat(60));
  console.log(diagnostics.join("\n"));
  
  if (warnings.length > 0) {
    console.log("\n⚠️ AVERTISSEMENTS:");
    warnings.forEach(w => console.log(w));
  }
  
  if (errors.length > 0) {
    console.log("\n❌ ERREURS:");
    errors.forEach(e => console.log(e));
    console.log("\n🔧 ACTIONS RECOMMANDÉES:");
    console.log("1. Vérifiez votre fichier .env à la racine du projet");
    console.log("2. Assurez-vous que toutes les variables VITE_FIREBASE_* sont définies");
    console.log("3. Redémarrez le serveur de développement (pnpm dev)");
    console.log("4. Vérifiez Firebase Console > Authentication > Settings > Authorized domains");
    console.log("5. Vérifiez que Google Sign-in est activé dans Firebase Console > Authentication > Sign-in method");
  } else {
    console.log("\n✅ Aucune erreur critique détectée");
  }
  
  console.log("\n" + "=".repeat(60));
  
  return {
    diagnostics,
    warnings,
    errors,
    hasErrors: errors.length > 0,
  };
}

// Exposer dans la console du navigateur pour faciliter le débogage
if (typeof window !== "undefined") {
  (window as any).diagnoseAuth = diagnoseAuth;
  console.log("💡 Utilisez diagnoseAuth() dans la console pour diagnostiquer l'authentification");
}

