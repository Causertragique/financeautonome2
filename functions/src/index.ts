import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

// Initialize Firebase Admin
admin.initializeApp();

const app = express();

// Middleware
app.use(cors({origin: true}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Example API routes
app.get("/ping", (_req, res) => {
  res.json({message: "pong"});
});

app.get("/demo", (_req, res) => {
  res.json({message: "Demo endpoint", timestamp: new Date().toISOString()});
});

// Routes pour les modes de paiement
app.get("/payment-methods", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({error: "userId is required"});
      return;
    }

    const db = admin.firestore();
    const paymentMethodsRef = db.collection("paymentMethods");
    const snapshot = await paymentMethodsRef
      .where("userId", "==", userId)
      .get();

    const methods = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(methods);
  } catch (error: any) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({error: error.message});
  }
});

app.post("/payment-methods", async (req, res) => {
  try {
    const {userId, type, label, last4, expiryDate} = req.body;

    if (!userId || !type || !label) {
      res.status(400).json({error: "userId, type, and label are required"});
      return;
    }

    const db = admin.firestore();
    const paymentMethodsRef = db.collection("paymentMethods");
    const docRef = await paymentMethodsRef.add({
      userId,
      type,
      label,
      last4: last4 || null,
      expiryDate: expiryDate || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({id: docRef.id, userId, type, label, last4, expiryDate});
  } catch (error: any) {
    console.error("Error creating payment method:", error);
    res.status(500).json({error: error.message});
  }
});

app.delete("/payment-methods/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const userId = req.query.userId as string;

    if (!userId) {
      res.status(400).json({error: "userId is required"});
      return;
    }

    const db = admin.firestore();
    const paymentMethodRef = db.collection("paymentMethods").doc(id);
    const doc = await paymentMethodRef.get();

    if (!doc.exists) {
      res.status(404).json({error: "Payment method not found"});
      return;
    }

    const data = doc.data();
    if (data?.userId !== userId) {
      res.status(403).json({error: "Unauthorized"});
      return;
    }

    await paymentMethodRef.delete();
    res.json({success: true});
  } catch (error: any) {
    console.error("Error deleting payment method:", error);
    res.status(500).json({error: error.message});
  }
});

// Export the Express app as a Firebase Function v1
export const api = functions.https.onRequest(app);
