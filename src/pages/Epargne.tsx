import React, { useState, useEffect } from "react";
import { Lightbulb, Folder, ExternalLink, Trash2, Plus, Send } from "lucide-react";
import MainLayout from "../layouts/MainLayout";

// Liens utiles
const usefulLinks = [
  {
    label: "Autorité des marchés financiers (AMF)",
    url: "https://lautorite.qc.ca/",
    description: "Régulateur des marchés financiers au Québec"
  },
  {
    label: "Revenu Québec",
    url: "https://www.revenuquebec.ca/",
    description: "Informations fiscales et services gouvernementaux"
  },
  {
    label: "Agence du revenu du Canada (ARC)",
    url: "https://www.canada.ca/fr/agence-revenu.html",
    description: "Services fiscaux fédéraux"
  },
  {
    label: "Éducaloi Finances",
    url: "https://www.educaloi.qc.ca/categories/finances",
    description: "Ressources éducatives sur les finances"
  },
  {
    label: "Programme d'éducation financière de l'AMF",
    url: "https://lautorite.qc.ca/grand-public/etre-bien-outille/education-financiere",
    description: "Outils et ressources éducatives"
  }
];

const SYSTEM_PROMPT = `Tu es un assistant qui aide à la planification de projets d'épargne. 

RÈGLES STRICTES :
- Tu n'es PAS un conseiller financier
- Tu ne donnes JAMAIS de conseils financiers personnalisés
- Tu ne fais JAMAIS de promesses de gain ou de rendement
- Tu ne recommandes JAMAIS de produits financiers spécifiques
- Tu ne proposes JAMAIS d'investissements ou de stratégies individuelles

TON RÔLE :
- Aider à structurer la réflexion sur des projets d'épargne
- Proposer des pistes générales et éducatives de planification
- Suggérer des méthodes organisationnelles et des outils
- Encourager la consultation de professionnels qualifiés
- Respecter la loi et les réglementations de l'AMF

STYLE DE RÉPONSE :
- Sois créatif et varié dans tes suggestions
- Adapte tes réponses au contexte spécifique de chaque question
- Propose des approches différentes selon le type de projet
- Utilise des exemples concrets et variés
- Évite les réponses génériques ou répétitives`;

export default function Epargne() {
  const [userQuestion, setUserQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<string[]>([]);
  const [newProject, setNewProject] = useState("");

  // Log au chargement du composant pour vérifier
  useEffect(() => {
    console.log("🚀 Composant Epargne chargé");
    console.log("🔍 Toutes les variables VITE_* détectées:", {
      VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY ? `✓ présent (${import.meta.env.VITE_OPENAI_API_KEY.substring(0, 10)}...)` : "✗ manquant",
      VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY ? "✓ présent" : "✗ manquant",
    });
    console.log("🔑 Vérification clé API OpenAI:", !!import.meta.env.VITE_OPENAI_API_KEY);
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      console.warn("⚠️ VITE_OPENAI_API_KEY n'est pas chargée. Vérifiez que :");
      console.warn("   1. Le fichier .env existe à la racine du projet");
      console.warn("   2. Il contient : VITE_OPENAI_API_KEY=sk-...");
      console.warn("   3. Le serveur a été redémarré après l'ajout");
    }
  }, []);

  // Charger les projets depuis localStorage au montage
  useEffect(() => {
    const savedProjects = localStorage.getItem("epargne_projects");
    if (savedProjects) {
      try {
        setProjects(JSON.parse(savedProjects));
      } catch (error) {
        console.error("Erreur lors du chargement des projets:", error);
      }
    }
  }, []);

  // Sauvegarder les projets dans localStorage
  useEffect(() => {
    if (projects.length > 0 || localStorage.getItem("epargne_projects")) {
      localStorage.setItem("epargne_projects", JSON.stringify(projects));
    }
  }, [projects]);

  // Fonction pour appeler l'API OpenAI
  const handleAskAI = async () => {
    console.log("🎯 handleAskAI appelé");
    console.log("📝 userQuestion:", userQuestion);
    
    if (!userQuestion.trim()) {
      console.log("⚠️ Question vide, arrêt");
      return;
    }

    setLoading(true);
    setAiResponse(null);

    try {
      console.log("📤 Envoi de la requête au serveur backend sécurisé...");

      // Appel sécurisé via le backend - la clé API reste côté serveur
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userQuestion,
        }),
      });

      console.log("📥 Statut de la réponse:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Erreur API:", errorData);
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Réponse reçue du serveur");
      
      if (!data.response) {
        console.error("⚠️ Aucune réponse dans les données:", data);
        throw new Error(data.error || "Aucune réponse reçue de l'IA.");
      }
      
      console.log("💬 Contenu de la réponse:", data.response);
      setAiResponse(data.response);
    } catch (error: any) {
      console.error("❌ Erreur complète:", error);
      setAiResponse(
        `Erreur : ${error.message || "Une erreur s'est produite lors de la communication avec l'IA. Vérifiez la console pour plus de détails."}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un projet
  const handleAddProject = () => {
    if (newProject.trim()) {
      setProjects([...projects, newProject.trim()]);
      setNewProject("");
    }
  };

  // Supprimer un projet
  const handleDeleteProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-emerald-700 mb-2">Épargne</h1>
          <p className="text-muted-foreground">
            Planifiez vos projets d'épargne avec l'aide de l'IA et organisez vos idées
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1 : Espace IA */}
          <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Lightbulb className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-emerald-700">Espace IA</h2>
            </div>
            
            <div className="mb-4">
              <label htmlFor="userQuestion" className="block text-sm font-medium text-gray-700 mb-2">
                Décrivez votre projet ou posez une question sur l'<strong>organisation</strong> de votre épargne
              </label>
              <textarea
                id="userQuestion"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                placeholder="Ex: Comment organiser mon épargne pour un voyage de 6 mois ? (outils, calendrier, étapes...)"
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Cet outil aide uniquement à <strong>organiser</strong> votre projet. Il ne donne pas de conseils sur les investissements ou produits financiers.
              </p>
            </div>

            <button
              onClick={(e) => {
                console.log("🖱️ Bouton cliqué!");
                e.preventDefault();
                handleAskAI();
              }}
              disabled={loading || !userQuestion.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>En cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Demander à l'IA</span>
                </>
              )}
            </button>

            {aiResponse && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="text-sm font-semibold text-emerald-800 mb-2">Réponse de l'IA :</div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{aiResponse}</div>
                <div className="mt-2 text-xs text-gray-500">
                  (Longueur: {aiResponse.length} caractères)
                </div>
              </div>
            )}

            <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <p className="text-sm font-bold text-red-900 mb-2">
                ⚠️ AVERTISSEMENT LÉGAL IMPORTANT
              </p>
              <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                <li>Cet outil ne fournit <strong>AUCUN conseil financier</strong> ni recommandation d'investissement.</li>
                <li>L'IA aide uniquement à <strong>organiser et structurer</strong> vos projets d'épargne.</li>
                <li><strong>AUCUN produit financier</strong> n'est recommandé par cet outil.</li>
                <li>Pour toute décision financière, consultez un <strong>professionnel qualifié et agréé</strong>.</li>
                <li>Cet outil respecte les réglementations de l'<strong>Autorité des marchés financiers (AMF)</strong>.</li>
              </ul>
              <p className="text-xs text-red-700 mt-2 font-semibold">
                En utilisant cet outil, vous reconnaissez que vous ne recevrez aucun conseil financier personnalisé.
              </p>
            </div>
          </div>

          {/* Section 2 : Espace Projets utilisateur */}
          <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Folder className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-emerald-700">Mes Projets d'Épargne</h2>
            </div>

            <div className="mb-4">
              <label htmlFor="newProject" className="block text-sm font-medium text-gray-700 mb-2">
                Ajouter un nouveau projet
              </label>
              <div className="flex gap-2">
                <input
                  id="newProject"
                  type="text"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddProject();
                    }
                  }}
                  placeholder="Ex: Voyage en Europe, Fonds d'urgence..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddProject}
                  disabled={!newProject.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Ajouter le projet"
                  title="Ajouter le projet"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Aucun projet enregistré. Ajoutez votre premier projet ci-dessus.
                </div>
              ) : (
                projects.map((project, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <span className="text-sm text-gray-700 flex-1">{project}</span>
                    <button
                      onClick={() => handleDeleteProject(index)}
                      className="ml-2 p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      aria-label="Supprimer le projet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Section 3 : Liens utiles */}
        <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ExternalLink className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-emerald-700">Liens Utiles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {usefulLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 border border-emerald-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <ExternalLink className="w-5 h-5 text-emerald-600 mt-0.5 group-hover:text-emerald-700 transition-colors" />
                  <div className="flex-1">
                    <div className="font-semibold text-emerald-700 group-hover:text-emerald-800 mb-1">
                      {link.label}
                    </div>
                    <div className="text-xs text-gray-600">{link.description}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

