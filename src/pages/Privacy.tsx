// src/pages/Privacy.tsx

import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Privacy() {
  // Utiliser useAuth de manière sécurisée (peut être undefined si pas dans AuthProvider)
  let currentUser = null;
  try {
    const auth = useAuth();
    currentUser = auth?.currentUser || null;
  } catch (error) {
    // Si le contexte n'est pas disponible, on continue sans utilisateur
    currentUser = null;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <Link
            to={currentUser ? "/" : "/login"}
            className="text-primary hover:underline inline-flex items-center gap-2"
          >
            ← {currentUser ? "Retour au tableau de bord" : "Retour à la connexion"}
          </Link>
        </div>
        <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-lg p-8 border border-border">
        <h1 className="text-3xl font-bold mb-4">Politique de confidentialité</h1>
        <p className="mb-6 text-muted-foreground">
          Nous attachons une grande importance à la protection de vos données personnelles.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">1. Données collectées</h2>
        <p>
          Nous recueillons uniquement les informations nécessaires à l’utilisation de NovaFinance : votre adresse e-mail, vos données de connexion, et les données saisies dans l’application (transactions, budgets, etc.).
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">2. Utilisation des données</h2>
        <p>
          Vos données sont utilisées exclusivement pour vous offrir les fonctionnalités de NovaFinance et améliorer le service. Elles ne sont jamais revendues à des tiers.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">3. Hébergement et sécurité</h2>
        <p>
          Vos informations sont stockées de manière sécurisée sur des serveurs gérés par Firebase (Google Cloud). Nous utilisons des mesures de sécurité standard pour protéger vos données.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">4. Accès et suppression</h2>
        <p>
          Vous pouvez accéder à vos données, les modifier ou demander leur suppression à tout moment via l’application ou en nous contactant.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">5. Cookies</h2>
        <p>
          NovaFinance utilise des cookies techniques pour garantir le bon fonctionnement du service (authentification, préférences linguistiques).
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">6. Partage avec des tiers</h2>
        <p>
          Vos données ne sont partagées avec aucun tiers en dehors des services nécessaires au fonctionnement (ex : Firebase, hébergement). Aucun partage commercial.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">7. Modification</h2>
        <p>
          Cette politique peut être modifiée. En cas de changement majeur, nous vous en informerons dans l’application.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">8. Contact</h2>
        <p>
          Pour toute question sur vos données, contactez : <a href="mailto:privacy@novafinance.app" className="text-primary underline">privacy@novafinance.app</a>
        </p>
        </div>
      </div>
    </div>
  );
}
