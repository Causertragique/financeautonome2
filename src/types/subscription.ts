// Types pour les abonnements Stripe

export type PlanType = "free" | "ia" | "pro";

export type BillingPeriod = "monthly" | "yearly";

export interface Subscription {
  id: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "unpaid";
  currentPeriodEnd: number; // Timestamp Unix
  currentPeriodStart: number; // Timestamp Unix
  cancelAtPeriodEnd: boolean;
  planName: string;
  planType: PlanType;
  priceId: string;
  billingPeriod: BillingPeriod;
}

export interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  planType: PlanType;
  isPro: boolean;
  isIA: boolean;
  refreshSubscription: () => Promise<void>;
  createCheckoutSession: (planType: PlanType, billingPeriod: BillingPeriod) => Promise<string | null>;
  cancelSubscription: () => Promise<void>;
  reactivateSubscription: () => Promise<void>;
}

