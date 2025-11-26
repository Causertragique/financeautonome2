# Configuration Stripe pour NovaFinance

## Installation

1. Installer le package Stripe :
```bash
npm install stripe
```

## Configuration des variables d'environnement

Ajoutez les variables suivantes dans votre fichier `.env` :

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...  # Clé secrète Stripe (test ou production)
STRIPE_WEBHOOK_SECRET=whsec_...  # Secret du webhook Stripe

# Stripe Price IDs (à créer dans le dashboard Stripe)
STRIPE_PRICE_ID_IA_MONTHLY=price_...
STRIPE_PRICE_ID_IA_YEARLY=price_...
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_YEARLY=price_...

# Frontend URL (pour les redirections Stripe)
FRONTEND_URL=http://localhost:5173  # En production: https://novafinances.app
```

## Création des produits et prix dans Stripe

1. Connectez-vous au [Dashboard Stripe](https://dashboard.stripe.com)
2. Allez dans **Produits** → **Ajouter un produit**
3. Créez les produits suivants :
   - **IA** (mensuel) : 4,99 $/mois
   - **IA** (annuel) : 47,90 $/an
   - **Pro** (mensuel) : 9,99 $/mois
   - **Pro** (annuel) : 95,90 $/an

4. Pour chaque produit, copiez le **Price ID** (commence par `price_`) et ajoutez-le dans votre `.env`

## Configuration du webhook

1. Dans le Dashboard Stripe, allez dans **Développeurs** → **Webhooks**
2. Cliquez sur **Ajouter un endpoint**
3. URL : `https://votre-domaine.com/api/stripe/webhook`
4. Événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copiez le **Signing secret** (commence par `whsec_`) et ajoutez-le dans votre `.env` comme `STRIPE_WEBHOOK_SECRET`

## Utilisation dans le code

### Frontend

```tsx
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionButton } from "@/components/SubscriptionButton";

function PricingPage() {
  const { createCheckoutSession, planType, isPro, isIA } = useSubscription();

  return (
    <SubscriptionButton planType="ia" billingPeriod="monthly">
      S'abonner au plan IA
    </SubscriptionButton>
  );
}
```

### Backend

Les routes suivantes sont disponibles :

- `POST /api/stripe/checkout` - Créer une session de checkout
- `GET /api/stripe/subscription/:userId` - Récupérer l'abonnement d'un utilisateur
- `POST /api/stripe/subscription/cancel` - Annuler un abonnement
- `POST /api/stripe/subscription/reactivate` - Réactiver un abonnement
- `POST /api/stripe/webhook` - Webhook Stripe (gestion automatique)
- `GET /api/stripe/prices` - Récupérer les price IDs disponibles

## Test en mode développement

1. Utilisez les clés de test Stripe (commence par `sk_test_`)
2. Utilisez les cartes de test Stripe :
   - Succès : `4242 4242 4242 4242`
   - Échec : `4000 0000 0000 0002`
   - Date d'expiration : n'importe quelle date future
   - CVC : n'importe quel 3 chiffres

## Déploiement en production

1. Remplacez les clés de test par les clés de production
2. Mettez à jour `FRONTEND_URL` avec votre domaine de production
3. Configurez le webhook avec l'URL de production
4. Testez le flux complet de paiement

## Structure des fichiers créés

- `server/routes/stripe.ts` - Routes backend Stripe
- `src/contexts/SubscriptionContext.tsx` - Contexte React pour les abonnements
- `src/components/SubscriptionButton.tsx` - Composant bouton d'abonnement
- `src/types/subscription.ts` - Types TypeScript pour les abonnements

