import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { Subscription, SubscriptionContextType, PlanType, BillingPeriod } from "@/types/subscription";

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription doit être utilisé dans un SubscriptionProvider");
  }
  return context;
}

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { currentUser } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Récupérer l'abonnement depuis le backend
  const fetchSubscription = async () => {
    if (!currentUser) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/stripe/subscription/${currentUser.uid}`);
      if (!response.ok) {
        if (response.status === 404) {
          setSubscription(null);
          setLoading(false);
          return;
        }
        throw new Error("Erreur lors de la récupération de l'abonnement");
      }

      const data = await response.json();
      
      if (data.subscription) {
        // Déterminer le type de plan basé sur le priceId
        const planType = determinePlanType(data.subscription.priceId);
        
        setSubscription({
          ...data.subscription,
          planType,
        });
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'abonnement:", error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  // Déterminer le type de plan basé sur le priceId
  const determinePlanType = (priceId: string): PlanType => {
    // Ces IDs doivent correspondre aux price IDs configurés dans Stripe
    if (priceId.includes("ia") || priceId.includes("IA")) {
      return "ia";
    }
    if (priceId.includes("pro") || priceId.includes("Pro")) {
      return "pro";
    }
    return "free";
  };

  useEffect(() => {
    fetchSubscription();
  }, [currentUser]);

  // Créer une session de checkout Stripe
  const createCheckoutSession = async (
    planType: PlanType,
    billingPeriod: BillingPeriod
  ): Promise<string | null> => {
    if (!currentUser || !currentUser.email) {
      throw new Error("Vous devez être connecté pour souscrire à un abonnement");
    }

    try {
      // Déterminer le priceId selon le plan et la période
      const priceId = await getPriceId(planType, billingPeriod);
      
      if (!priceId) {
        throw new Error("Plan non disponible");
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          billingPeriod,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création de la session");
      }

      const data = await response.json();
      
      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
        return data.sessionId;
      }

      return null;
    } catch (error: any) {
      console.error("Erreur lors de la création de la session:", error);
      throw error;
    }
  };

  // Obtenir le priceId selon le plan et la période
  // Note: Les priceIds sont gérés côté backend pour plus de sécurité
  const getPriceId = async (planType: PlanType, billingPeriod: BillingPeriod): Promise<string | null> => {
    try {
      // Récupérer les priceIds depuis le backend
      const response = await fetch("/api/stripe/prices");
      if (response.ok) {
        const data = await response.json();
        return data[planType]?.[billingPeriod] || null;
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des prix:", error);
    }
    
    // Fallback: utiliser les variables d'environnement (moins sécurisé)
    if (planType === "ia") {
      return billingPeriod === "monthly"
        ? import.meta.env.VITE_STRIPE_PRICE_ID_IA_MONTHLY || null
        : import.meta.env.VITE_STRIPE_PRICE_ID_IA_YEARLY || null;
    }
    if (planType === "pro") {
      return billingPeriod === "monthly"
        ? import.meta.env.VITE_STRIPE_PRICE_ID_PRO_MONTHLY || null
        : import.meta.env.VITE_STRIPE_PRICE_ID_PRO_YEARLY || null;
    }
    return null;
  };

  // Annuler l'abonnement
  const cancelSubscription = async () => {
    if (!subscription) {
      throw new Error("Aucun abonnement actif");
    }

    try {
      const response = await fetch("/api/stripe/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'annulation");
      }

      // Rafraîchir l'abonnement
      await fetchSubscription();
    } catch (error: any) {
      console.error("Erreur lors de l'annulation:", error);
      throw error;
    }
  };

  // Réactiver l'abonnement
  const reactivateSubscription = async () => {
    if (!subscription) {
      throw new Error("Aucun abonnement actif");
    }

    try {
      const response = await fetch("/api/stripe/subscription/reactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la réactivation");
      }

      // Rafraîchir l'abonnement
      await fetchSubscription();
    } catch (error: any) {
      console.error("Erreur lors de la réactivation:", error);
      throw error;
    }
  };

  const planType: PlanType = subscription?.planType || "free";
  const isPro = planType === "pro";
  const isIA = planType === "ia" || isPro; // Pro inclut les fonctionnalités IA

  const value: SubscriptionContextType = {
    subscription,
    loading,
    planType,
    isPro,
    isIA,
    refreshSubscription: fetchSubscription,
    createCheckoutSession,
    cancelSubscription,
    reactivateSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

