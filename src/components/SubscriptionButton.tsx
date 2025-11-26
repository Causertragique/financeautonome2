import React, { useState } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import type { PlanType, BillingPeriod } from "@/types/subscription";

interface SubscriptionButtonProps {
  planType: PlanType;
  billingPeriod: BillingPeriod;
  className?: string;
  children?: React.ReactNode;
}

export function SubscriptionButton({
  planType,
  billingPeriod,
  className = "",
  children,
}: SubscriptionButtonProps) {
  const { currentUser } = useAuth();
  const { createCheckoutSession, planType: currentPlan, loading } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    if (!currentUser) {
      // Rediriger vers la page de connexion
      window.location.href = "/login?redirect=/guest?tab=tarif";
      return;
    }

    if (planType === "free") {
      return; // Le plan gratuit ne nécessite pas de paiement
    }

    setIsProcessing(true);
    try {
      await createCheckoutSession(planType, billingPeriod);
    } catch (error: any) {
      console.error("Erreur lors de la création de la session:", error);
      alert(error.message || "Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Si l'utilisateur a déjà ce plan ou un plan supérieur, afficher un message
  const isCurrentPlan = currentPlan === planType;
  const hasHigherPlan =
    (planType === "ia" && currentPlan === "pro") ||
    (planType === "free" && (currentPlan === "ia" || currentPlan === "pro"));

  if (loading) {
    return (
      <button
        disabled
        className={`${className} opacity-50 cursor-not-allowed flex items-center justify-center gap-2`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Chargement...</span>
      </button>
    );
  }

  if (isCurrentPlan || hasHigherPlan) {
    return (
      <button
        disabled
        className={`${className} opacity-50 cursor-not-allowed`}
      >
        {isCurrentPlan ? "Plan actuel" : "Plan supérieur actif"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className={`${className} ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {isProcessing ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Redirection...</span>
        </span>
      ) : (
        children || "S'abonner"
      )}
    </button>
  );
}

