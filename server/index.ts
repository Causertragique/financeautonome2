import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getPaymentMethods, createPaymentMethod, deletePaymentMethod } from "./routes/payment-methods";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
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

  return app;
}
