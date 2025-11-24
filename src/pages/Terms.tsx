// src/pages/Terms.tsx

import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Terms() {
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
          <h1 className="text-3xl font-bold mb-2">Conditions d'utilisation</h1>
          <p className="text-sm text-muted-foreground mb-6">
            <strong>End User License Agreement (EULA)</strong> - Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="mb-6 text-muted-foreground">
            Bienvenue sur NovaFinance. En utilisant cette application, vous acceptez les conditions suivantes :
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">1. Acceptation des conditions</h2>
          <p className="mb-4">
            En accédant et en utilisant NovaFinance, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">2. Utilisation de l'application</h2>
          <p className="mb-4">
            NovaFinance est un outil de gestion budgétaire et financière destiné à un usage personnel et professionnel. Vous vous engagez à :
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4 ml-4 text-muted-foreground">
            <li>Fournir des informations exactes et à jour lors de la création de votre compte</li>
            <li>Ne pas utiliser l'application à des fins frauduleuses ou illégales</li>
            <li>Maintenir la confidentialité de vos identifiants de connexion</li>
            <li>Utiliser le service conformément à toutes les lois et réglementations applicables</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-2">3. Compte utilisateur</h2>
          <p className="mb-4">
            Vous êtes responsable de la confidentialité de vos informations de connexion et de toutes les activités qui se produisent sous votre compte. En cas de suspicion d'utilisation non autorisée, veuillez nous contacter immédiatement à <a href="mailto:support@novafinance.app" className="text-primary underline">support@novafinance.app</a>.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">4. Propriété intellectuelle</h2>
          <p className="mb-4">
            Le code, le design, le contenu et toutes les fonctionnalités de NovaFinance sont protégés par les lois sur la propriété intellectuelle. Toute reproduction, distribution, modification ou utilisation non autorisée est strictement interdite.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">5. Limitation de responsabilité</h2>
          <p className="mb-4">
            NovaFinance fournit des outils d'aide à la gestion financière à titre informatif. Nous ne garantissons pas l'exactitude, l'exhaustivité ou la pertinence des informations fournies. L'utilisateur reste seul responsable de l'utilisation des informations et de toute décision prise sur la base de ces informations.
          </p>
          <p className="mb-4">
            NovaFinance ne peut être tenu responsable des pertes financières, des erreurs de calcul, ou de tout dommage résultant de l'utilisation ou de l'impossibilité d'utiliser le service.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">6. Protection des données</h2>
          <p className="mb-4">
            Vos données personnelles sont traitées conformément à notre <Link to="/privacy" className="text-primary underline">Politique de confidentialité</Link>. En utilisant NovaFinance, vous acceptez également les termes de cette politique.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">7. Modification et résiliation</h2>
          <p className="mb-4">
            Nous nous réservons le droit de modifier les présentes conditions d'utilisation à tout moment. En cas de modification significative, nous vous en informerons par email ou via une notification dans l'application. Votre utilisation continue du service après ces modifications constitue votre acceptation des nouvelles conditions.
          </p>
          <p className="mb-4">
            Vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre compte. Nous nous réservons également le droit de suspendre ou de résilier votre compte en cas de violation de ces conditions.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">8. Droit applicable</h2>
          <p className="mb-4">
            Les présentes conditions d'utilisation sont régies par les lois applicables. Tout litige sera soumis à la juridiction compétente.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-2">9. Contact</h2>
          <p className="mb-4">
            Pour toute question concernant ces conditions d'utilisation, contactez-nous à l'adresse suivante : <a href="mailto:support@novafinance.app" className="text-primary underline">support@novafinance.app</a>
          </p>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              En utilisant NovaFinance, vous reconnaissez avoir lu, compris et accepté ces conditions d'utilisation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
