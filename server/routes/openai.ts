import { RequestHandler } from "express";

const SYSTEM_PROMPT = `Tu es un assistant qui aide UNIQUEMENT à la planification organisationnelle de projets d'épargne. 

⚠️ RÈGLES ABSOLUES - À RESPECTER SANS EXCEPTION :

1. TU N'ES PAS UN CONSEILLER FINANCIER et tu ne peux jamais agir comme tel.

2. INTERDICTIONS STRICTES - Tu ne dois JAMAIS :
   - Donner des conseils financiers personnalisés
   - Recommander des produits financiers, placements ou investissements spécifiques
   - Proposer des stratégies d'investissement
   - Faire des promesses de gain, rendement ou performance
   - Donner des conseils fiscaux personnalisés
   - Recommander des institutions financières spécifiques
   - Suggérer des montants à investir ou épargner
   - Donner des conseils sur les taux d'intérêt, actions, obligations, crypto-monnaies
   - Faire des prévisions financières ou économiques

3. TON RÔLE UNIQUEMENT :
   - Aider à ORGANISER et STRUCTURER la réflexion sur des projets d'épargne
   - Proposer des méthodes organisationnelles (listes, calendriers, outils de suivi)
   - Suggérer des outils numériques génériques (tableurs, applications de suivi)
   - Encourager la consultation de professionnels qualifiés et agréés
   - Fournir des informations éducatives générales sur la planification

4. CONFORMITÉ RÉGLEMENTAIRE :
   - Respecte strictement les réglementations de l'Autorité des marchés financiers (AMF)
   - Rappelle toujours que seul un professionnel agréé peut donner des conseils financiers
   - Dirige vers l'AMF pour toute question réglementaire

5. SI UNE QUESTION DEMANDE UN CONSEIL FINANCIER :
   - Refuse poliment mais fermement
   - Explique que tu ne peux pas donner de conseils financiers
   - Redirige vers un professionnel qualifié ou l'AMF

6. STYLE DE RÉPONSE :
   - Sois créatif et varié dans tes suggestions organisationnelles
   - Adapte tes réponses au contexte spécifique
   - Utilise des exemples concrets mais génériques
   - Évite les réponses génériques ou répétitives
   - Termine souvent par rappeler de consulter un professionnel`;

interface OpenAIRequest {
  question: string;
}

interface OpenAIResponse {
  response: string;
  error?: string;
}

// Mots-clés interdits qui indiquent une demande de conseil financier
const FORBIDDEN_KEYWORDS = [
  "investir", "investissement", "placement", "rendement", "taux de rendement",
  "action", "obligation", "fonds", "ETF", "crypto", "bitcoin", "cryptomonnaie",
  "conseil financier", "conseiller financier", "quelle banque", "quel produit",
  "me recommander", "tu recommandes", "devrais-je", "dois-je investir",
  "combien investir", "où investir", "comment investir", "stratégie d'investissement",
  "conseil fiscal", "optimisation fiscale", "évasion fiscale", "fraude fiscale",
  "garantie", "sans risque", "sûr", "rentable", "profitable", "gain assuré"
];

// Valider que la question ne demande pas de conseil financier
function validateQuestion(question: string): { valid: boolean; reason?: string } {
  const questionLower = question.toLowerCase();
  
  // Vérifier les mots-clés interdits
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (questionLower.includes(keyword.toLowerCase())) {
      return {
        valid: false,
        reason: `Cette question semble demander un conseil financier ou des recommandations d'investissement, ce qui n'est pas autorisé. Veuillez reformuler votre question pour qu'elle porte uniquement sur l'organisation et la planification de votre projet d'épargne.`
      };
    }
  }
  
  // Vérifier les patterns de questions interdites
  const forbiddenPatterns = [
    /(quelle|quel|quels|quelles)\s+(banque|produit|placement|investissement|fonds)/i,
    /(me\s+)?(recommande|suggère|conseille).*(investir|placement|produit)/i,
    /(devrais|dois|faut).*(investir|placer|acheter)/i,
    /(combien|montant).*(investir|placer|mettre)/i,
    /(où|comment).*(investir|placer|mettre.*argent)/i,
    /(garantie|sans risque|sûr).*(rendement|gain|profit)/i
  ];
  
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(question)) {
      return {
        valid: false,
        reason: `Cette question semble demander des recommandations financières spécifiques, ce qui n'est pas autorisé. Veuillez reformuler pour demander uniquement de l'aide à l'organisation de votre projet.`
      };
    }
  }
  
  return { valid: true };
}

export const handleOpenAI: RequestHandler = async (req, res) => {
  try {
    const { question }: OpenAIRequest = req.body;

    if (!question || typeof question !== "string" || question.trim() === "") {
      return res.status(400).json({
        error: "La question est requise et doit être une chaîne de caractères non vide",
      } as OpenAIResponse);
    }

    // Validation de sécurité : vérifier que la question ne demande pas de conseil financier
    const validation = validateQuestion(question);
    if (!validation.valid) {
      console.warn("⚠️ Question rejetée pour demande de conseil financier:", question);
      return res.status(400).json({
        error: validation.reason || "Cette question n'est pas autorisée.",
      } as OpenAIResponse);
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error("❌ OPENAI_API_KEY n'est pas configurée dans les variables d'environnement du serveur");
      return res.status(500).json({
        error: "Configuration serveur manquante. Contactez l'administrateur.",
      } as OpenAIResponse);
    }

    console.log("📤 Appel à OpenAI pour la question:", question.substring(0, 50) + "...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `Contexte : L'utilisateur planifie un projet d'épargne et demande de l'aide pour l'ORGANISATION et la PLANIFICATION, PAS pour des conseils financiers.

Question ou description du projet :
${question}

IMPORTANT : 
- Réponds UNIQUEMENT sur l'organisation, la structuration et la planification
- NE donne AUCUN conseil financier, placement ou investissement
- NE recommande AUCUN produit financier
- Rappelle de consulter un professionnel qualifié pour les décisions financières
- Fournis une réponse personnalisée, créative et adaptée à ce projet spécifique
- Évite les réponses génériques`,
          },
        ],
        temperature: 0.9,
        max_tokens: 800,
        presence_penalty: 0.6,
        frequency_penalty: 0.5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Erreur OpenAI API:", errorData);

      if (response.status === 401) {
        return res.status(500).json({
          error: "Clé API invalide. Contactez l'administrateur.",
        } as OpenAIResponse);
      } else if (response.status === 429) {
        return res.status(429).json({
          error: "Limite de requêtes atteinte. Veuillez réessayer plus tard.",
        } as OpenAIResponse);
      } else {
        return res.status(response.status).json({
          error: errorData.error?.message || `Erreur ${response.status}: ${response.statusText}`,
        } as OpenAIResponse);
      }
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("⚠️ Aucun contenu dans la réponse OpenAI:", data);
      return res.status(500).json({
        error: "Aucune réponse reçue de l'IA.",
      } as OpenAIResponse);
    }

    console.log("✅ Réponse OpenAI reçue avec succès");
    return res.status(200).json({
      response: content,
    } as OpenAIResponse);
  } catch (error: any) {
    console.error("❌ Erreur lors de l'appel OpenAI:", error);
    return res.status(500).json({
      error: error.message || "Une erreur s'est produite lors de la communication avec l'IA.",
    } as OpenAIResponse);
  }
};

