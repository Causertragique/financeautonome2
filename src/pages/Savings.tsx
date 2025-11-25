import React, { useState } from "react";
import { Lightbulb, ShieldCheck, Folder, Link2, Plus, X } from "lucide-react";
import MainLayout from "../layouts/MainLayout";

// Exemples de prompts pour l’IA
const aiPrompts = [
  "Découper mon objectif d’épargne en étapes concrètes",
  "Trouver des outils numériques pour organiser un projet",
  "Créer une checklist personnalisée pour avancer",
  "Idées pour garder la motivation (micro-défis, rappels, etc.)"
];

// Liens ressources officielles & utiles
const resourceLinks = [
  {
    label: "Autorité des marchés financiers (AMF)",
    url: "https://lautorite.qc.ca/"
  },
  {
    label: "Agence du revenu du Canada (ARC)",
    url: "https://www.canada.ca/fr/agence-revenu.html"
  },
  {
    label: "Revenu Québec",
    url: "https://www.revenuquebec.ca/"
  },
  {
    label: "Programme d’éducation financière de l’AMF",
    url: "https://lautorite.qc.ca/grand-public/etre-bien-outille/education-financiere"
  },
  {
    label: "Calculatrice d’épargne de l’AMF",
    url: "https://lautorite.qc.ca/grand-public/outils/calculatrice-d-epargne/"
  }
];

export default function Savings() {
  // Espace IA
  const [userQuery, setUserQuery] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Espace Projets utilisateur (exemple local, à brancher sur DB ou cloud)
  const [projects, setProjects] = useState<{ 
    name: string; 
    note: string; 
    targetAmount?: number; 
    period?: string; 
    duration?: number;
    amountPerPeriod?: number;
  }[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectNote, setNewProjectNote] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [period, setPeriod] = useState<"weekly" | "biweekly" | "monthly">("monthly");
  const [duration, setDuration] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // IA bridée — plugger ta logique ici si tu veux utiliser l’API OpenAI/ChatGPT
  const handlePrompt = async (prompt: string) => {
    setLoading(true);
    setAiSuggestion(null);
    // Appel IA simulé
    setTimeout(() => {
      setAiSuggestion(
        "Voici une inspiration IA : Décomposez votre projet en étapes simples et mesurables, fixez des dates butoirs, et automatisez le suivi avec des outils comme Notion ou Google Sheets. Rappelez-vous, ceci n’est pas un conseil financier."
      );
      setLoading(false);
    }, 900);
  };

  // Calcul du montant par période
  const calculateAmountPerPeriod = () => {
    const target = parseFloat(targetAmount);
    const dur = parseFloat(duration);
    
    if (!target || !dur || dur <= 0) return null;
    
    // La durée est directement le nombre de versements
    return (target / dur).toFixed(2);
  };

  // Calcul de la durée totale en mois pour affichage
  const calculateTotalMonths = () => {
    const dur = parseFloat(duration);
    if (!dur || dur <= 0) return null;
    
    switch (period) {
      case "weekly":
        return (dur / 4).toFixed(1); // Approximation : 4 semaines par mois
      case "biweekly":
        return (dur / 2).toFixed(1); // 2 périodes bi-mensuelles par mois
      case "monthly":
        return dur.toFixed(0);
      default:
        return null;
    }
  };

  const amountPerPeriod = calculateAmountPerPeriod();

  // Ajout projet utilisateur
  const addProject = () => {
    if (!newProjectName.trim()) return;
    const projectData: {
      name: string;
      note: string;
      targetAmount?: number;
      period?: string;
      duration?: number;
      amountPerPeriod?: number;
    } = {
      name: newProjectName.trim(),
      note: newProjectNote.trim()
    };
    
    if (targetAmount && duration) {
      projectData.targetAmount = parseFloat(targetAmount);
      projectData.period = period;
      projectData.duration = parseFloat(duration);
      if (amountPerPeriod) {
        projectData.amountPerPeriod = parseFloat(amountPerPeriod);
      }
    }
    
    setProjects([...projects, projectData]);
    setNewProjectName("");
    setNewProjectNote("");
    setTargetAmount("");
    setPeriod("monthly");
    setDuration("");
    setIsModalOpen(false);
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-4 p-4">
        {/* Première ligne : IA et Projets côte à côte */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Section 1 — IA */}
          <section className="bg-card border border-border rounded-lg p-4 flex flex-col shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <h2 className="text-base font-bold">Inspiration IA</h2>
        </div>
        <div className="mb-2 text-xs text-muted-foreground">
          Posez vos questions pour structurer vos projets d’épargne, organiser vos idées, trouver des outils — <b>jamais de conseil financier</b>.
        </div>
        <div className="bg-muted/30 border-l-4 border-yellow-400 text-yellow-900 px-3 py-1.5 mb-3 rounded text-xs">
          L'IA ne remplace jamais un professionnel agréé. Les suggestions sont strictement organisationnelles.
        </div>
        {/* Prompts rapides */}
        <div className="mb-3">
          <ul className="grid gap-1.5">
            {aiPrompts.map((prompt, i) => (
              <li key={i}>
                <button
                  className="w-full px-2 py-1.5 bg-secondary rounded-md hover:bg-secondary/80 text-left transition text-xs"
                  onClick={() => handlePrompt(prompt)}
                  disabled={loading}
                >
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* Zone question personnalisée */}
        <div className="flex gap-2 mb-2">
          <label htmlFor="userQuery" className="sr-only">Question personnalisée</label>
          <input
            id="userQuery"
            type="text"
            value={userQuery}
            onChange={e => setUserQuery(e.target.value)}
            className="flex-1 px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none"
            placeholder="Ex: Comment planifier un défi d’épargne ?"
            disabled={loading}
          />
          <button
            onClick={() => handlePrompt(userQuery)}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
            disabled={loading || userQuery.trim() === ""}
          >
            Demander
          </button>
        </div>
        {loading && <div className="text-xs text-muted-foreground">L'IA réfléchit…</div>}
        {aiSuggestion && (
          <div className="bg-muted/40 rounded p-2 border mt-2 text-xs">
            <b>Suggestion IA :</b> <span>{aiSuggestion}</span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-green-700" />
          <span>
            Conformité réglementaire assurée. Aucune promesse, aucun conseil d’investissement.
          </span>
        </div>
      </section>

      {/* Section 2 — Projets utilisateur */}
      <section className="bg-card border border-border rounded-lg p-4 flex flex-col shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold">Mes projets d'épargne</h2>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
          >
            <Plus className="w-3 h-3" />
            Ajouter un projet
          </button>
        </div>
        <div className="mb-3 text-muted-foreground text-xs">
          Sauvegardez vos projets ici. Notez vos étapes, suivez l'avancement, ajoutez ou supprimez à volonté.
        </div>
        <div className="flex-1 overflow-y-auto">
          {projects.length === 0 && (
            <div className="text-muted-foreground text-xs text-center py-8">
              Aucun projet sauvegardé pour l'instant.
            </div>
          )}
          <ul className="space-y-2">
            {projects.map((proj, i) => (
              <li key={i} className="border rounded-md p-2 bg-muted/50 flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{proj.name}</div>
                  {proj.targetAmount && proj.amountPerPeriod && (
                    <div className="text-xs text-primary font-medium mt-1">
                      Objectif: {proj.targetAmount.toFixed(2)} $ • {proj.amountPerPeriod.toFixed(2)} $ / {proj.period === "weekly" ? "semaine" : proj.period === "biweekly" ? "2 semaines" : "mois"}
                    </div>
                  )}
                  {proj.note && (
                    <div className="text-xs text-muted-foreground mt-1">{proj.note}</div>
                  )}
                </div>
                <button
                  className="text-destructive ml-2 text-xs underline hover:text-destructive/80"
                  onClick={() => removeProject(i)}
                  title="Supprimer"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
        </div>

        {/* Deuxième ligne : Ressources sur toute la largeur */}
        {/* Section 3 — Ressources et liens */}
        <section className="bg-card border border-border rounded-lg p-4 flex flex-col shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="w-4 h-4 text-purple-600" />
          <h2 className="text-base font-bold">En apprendre un peu plus...</h2>
        </div>
        <div className="mb-2 text-muted-foreground text-xs">
          Informez-vous avec des sources reconnues :
        </div>
        <ul className="space-y-2 mb-3">
          {resourceLinks.map((link, i) => (
            <li key={i}>
              <a
                href={link.url}
                className="text-primary underline hover:text-primary/80 transition"
                target="_blank" rel="noopener noreferrer"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="text-xs text-muted-foreground mt-auto">
          L'information, c'est le vrai pouvoir. Toutes ces ressources sont neutres et fiables.
        </div>
        </section>
      </div>

      {/* Modal pour ajouter un projet */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-4 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold">Ajouter un projet</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewProjectName("");
                  setNewProjectNote("");
                  setTargetAmount("");
                  setPeriod("monthly");
                  setDuration("");
                }}
                className="text-muted-foreground hover:text-foreground transition"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="modalProjectName" className="block text-xs font-medium mb-1">
                  Nom du projet *
                </label>
                <input
                  id="modalProjectName"
                  type="text"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="Ex: Voyage en Europe"
                  className="w-full px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newProjectName.trim()) {
                      addProject();
                    }
                  }}
                />
              </div>
              <div>
                <label htmlFor="targetAmount" className="block text-xs font-medium mb-1">
                  Objectif financier ($)
                </label>
                <input
                  id="targetAmount"
                  type="number"
                  value={targetAmount}
                  onChange={e => setTargetAmount(e.target.value)}
                  placeholder="Ex: 5000"
                  min="0"
                  step="0.01"
                  className="w-full px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="period" className="block text-xs font-medium mb-1">
                    Période
                  </label>
                  <select
                    id="period"
                    value={period}
                    onChange={e => setPeriod(e.target.value as "weekly" | "biweekly" | "monthly")}
                    className="w-full px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="weekly">Hebdomadaire</option>
                    <option value="biweekly">Bi-mensuel</option>
                    <option value="monthly">Mensuel</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="duration" className="block text-xs font-medium mb-1">
                    Durée (mois)
                  </label>
                  <input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="Ex: 12"
                    min="1"
                    className="w-full px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {amountPerPeriod && (
                <div className="bg-primary/10 border border-primary/20 rounded-md p-3">
                  <div className="text-xs font-medium text-primary mb-1">
                    Montant à épargner par période :
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {amountPerPeriod} $
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {period === "weekly" && "par semaine"}
                    {period === "biweekly" && "aux deux semaines"}
                    {period === "monthly" && "par mois"}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="modalProjectNote" className="block text-xs font-medium mb-1">
                  Notes, étapes, objectifs
                </label>
                <textarea
                  id="modalProjectNote"
                  value={newProjectNote}
                  onChange={e => setNewProjectNote(e.target.value)}
                  placeholder="Notes, étapes, objectifs…"
                  rows={3}
                  className="w-full px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={addProject}
                  className="flex-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition"
                  disabled={!newProjectName.trim()}
                >
                  Ajouter le projet
                </button>
                <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewProjectName("");
                  setNewProjectNote("");
                  setTargetAmount("");
                  setPeriod("monthly");
                  setDuration("");
                }}
                  className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
