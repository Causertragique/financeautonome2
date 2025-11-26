import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getPaymentMethods, createPaymentMethod, deletePaymentMethod } from "./routes/payment-methods";
import { handleOpenAI } from "./routes/openai";
import {
  createCheckoutSession,
  getSubscription,
  cancelSubscription,
  reactivateSubscription,
  handleWebhook,
  getPrices,
} from "./routes/stripe";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  
  // Webhook Stripe doit recevoir le body brut, donc on l'exclut du parsing JSON
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    handleWebhook
  );
  
  // Middleware JSON pour toutes les autres routes
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Routes pour les modes de paiement
  app.get("/api/payment-methods", getPaymentMethods);
  app.post("/api/payment-methods", createPaymentMethod);
  app.delete("/api/payment-methods/:id", deletePaymentMethod);

  // Route sécurisée pour OpenAI (la clé API reste côté serveur)
  app.post("/api/openai", handleOpenAI);

  // Routes Stripe
  app.get("/api/stripe/prices", getPrices);
  app.post("/api/stripe/checkout", createCheckoutSession);
  app.get("/api/stripe/subscription/:userId", getSubscription);
  app.post("/api/stripe/subscription/cancel", cancelSubscription);
  app.post("/api/stripe/subscription/reactivate", reactivateSubscription);

  return app;
}
