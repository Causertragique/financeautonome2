import express from "express";

// Fonction pour obtenir l'instance Stripe (lazy initialization)
// Utiliser any pour éviter les problèmes de type lors du build
let stripeInstance: any = null;
let stripeModule: any = null;

async function getStripe(): Promise<any> {
  if (stripeInstance) {
    return stripeInstance;
  }

  // Ne pas initialiser Stripe si on est dans un environnement de build client
  if (typeof window !== "undefined") {
    return null;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("⚠️ STRIPE_SECRET_KEY n'est pas définie dans les variables d'environnement");
    return null;
  }

  try {
    // Import dynamique pour éviter le bundling dans le client
    if (!stripeModule) {
      stripeModule = await import("stripe");
    }
    const Stripe = stripeModule.default || stripeModule;
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    });
    return stripeInstance;
  } catch (error) {
    console.error("Erreur lors de l'initialisation de Stripe:", error);
    return null;
  }
}

// Types de plans disponibles
export const STRIPE_PLANS = {
  free: {
    name: "Gratuit",
    priceId: null, // Pas de prix Stripe pour le plan gratuit
  },
  ia: {
    name: "IA",
    monthlyPriceId: process.env.STRIPE_PRICE_ID_IA_MONTHLY || "",
    yearlyPriceId: process.env.STRIPE_PRICE_ID_IA_YEARLY || "",
  },
  pro: {
    name: "Pro",
    monthlyPriceId: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || "",
    yearlyPriceId: process.env.STRIPE_PRICE_ID_PRO_YEARLY || "",
  },
} as const;

// Récupérer les priceIds disponibles
export const getPrices = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    res.json({
      ia: {
        monthly: process.env.STRIPE_PRICE_ID_IA_MONTHLY || null,
        yearly: process.env.STRIPE_PRICE_ID_IA_YEARLY || null,
      },
      pro: {
        monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || null,
        yearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY || null,
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des prix:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des prix",
      details: error.message,
    });
  }
};

// Créer une session de checkout
export const createCheckoutSession = async (
  req: express.Request,
  res: express.Response
) => {
  const stripe = await getStripe();
  if (!stripe) {
    return res.status(500).json({
      error: "Stripe n'est pas configuré. Vérifiez STRIPE_SECRET_KEY dans les variables d'environnement.",
    });
  }

  try {
    const { priceId, userId, userEmail, billingPeriod } = req.body;

    if (!priceId || !userId || !userEmail) {
      return res.status(400).json({
        error: "priceId, userId et userEmail sont requis",
      });
    }

    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/guest?tab=tarif&canceled=true`,
      customer_email: userEmail,
      metadata: {
        userId,
        billingPeriod: billingPeriod || "monthly",
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Erreur lors de la création de la session Stripe:", error);
    res.status(500).json({
      error: "Erreur lors de la création de la session de paiement",
      details: error.message,
    });
  }
};

// Récupérer les informations d'abonnement d'un utilisateur
export const getSubscription = async (
  req: express.Request,
  res: express.Response
) => {
  const stripe = await getStripe();
  if (!stripe) {
    return res.status(500).json({
      error: "Stripe n'est pas configuré. Vérifiez STRIPE_SECRET_KEY dans les variables d'environnement.",
    });
  }

  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId est requis" });
    }

    // Récupérer les abonnements actifs de l'utilisateur depuis Stripe
    const subscriptions = await stripe.subscriptions.list({
      limit: 10,
      metadata: { userId },
    });

    if (subscriptions.data.length === 0) {
      return res.json({ subscription: null });
    }

    const activeSubscription = subscriptions.data.find(
      (sub) => sub.status === "active" || sub.status === "trialing"
    );

    if (!activeSubscription) {
      return res.json({ subscription: null });
    }

    // Récupérer les détails du produit
    const priceId = activeSubscription.items.data[0]?.price.id;
    const price = priceId ? await stripe.prices.retrieve(priceId) : null;
    const product = price?.product
      ? await stripe.products.retrieve(price.product as string)
      : null;

    res.json({
      subscription: {
        id: activeSubscription.id,
        status: activeSubscription.status,
        currentPeriodEnd: activeSubscription.current_period_end,
        currentPeriodStart: activeSubscription.current_period_start,
        cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
        planName: product?.name || "Inconnu",
        priceId: priceId,
        billingPeriod: price?.recurring?.interval || "month",
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération de l'abonnement:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération de l'abonnement",
      details: error.message,
    });
  }
};

// Annuler un abonnement
export const cancelSubscription = async (
  req: express.Request,
  res: express.Response
) => {
  const stripe = await getStripe();
  if (!stripe) {
    return res.status(500).json({
      error: "Stripe n'est pas configuré. Vérifiez STRIPE_SECRET_KEY dans les variables d'environnement.",
    });
  }

  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: "subscriptionId est requis" });
    }

    // Annuler l'abonnement à la fin de la période
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end,
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de l'annulation de l'abonnement:", error);
    res.status(500).json({
      error: "Erreur lors de l'annulation de l'abonnement",
      details: error.message,
    });
  }
};

// Réactiver un abonnement annulé
export const reactivateSubscription = async (
  req: express.Request,
  res: express.Response
) => {
  const stripe = await getStripe();
  if (!stripe) {
    return res.status(500).json({
      error: "Stripe n'est pas configuré. Vérifiez STRIPE_SECRET_KEY dans les variables d'environnement.",
    });
  }

  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: "subscriptionId est requis" });
    }

    // Réactiver l'abonnement
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de la réactivation de l'abonnement:", error);
    res.status(500).json({
      error: "Erreur lors de la réactivation de l'abonnement",
      details: error.message,
    });
  }
};

// Webhook Stripe pour gérer les événements
export const handleWebhook = async (
  req: express.Request,
  res: express.Response
) => {
  const stripe = await getStripe();
  if (!stripe) {
    return res.status(500).send("Stripe n'est pas configuré");
  }

  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).send("Signature manquante");
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("⚠️ STRIPE_WEBHOOK_SECRET n'est pas définie");
      return res.status(500).send("Configuration webhook manquante");
    }

    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error("Erreur de vérification du webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer les différents types d'événements
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("✅ Checkout complété:", session.id);
        // Ici, vous pouvez mettre à jour Firestore avec l'abonnement
        // await updateUserSubscription(session.metadata?.userId, session.subscription);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("📦 Abonnement créé/mis à jour:", subscription.id);
        // Mettre à jour Firestore
        // await updateUserSubscription(subscription.metadata?.userId, subscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("❌ Abonnement supprimé:", subscription.id);
        // Mettre à jour Firestore pour retirer l'abonnement
        // await removeUserSubscription(subscription.metadata?.userId);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("💳 Paiement réussi:", invoice.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("⚠️ Paiement échoué:", invoice.id);
        break;
      }

      default:
        console.log(`Événement non géré: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("Erreur lors du traitement du webhook:", error);
    res.status(500).json({ error: error.message });
  }
};

