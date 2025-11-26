import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { SubscriptionButton } from "../components/SubscriptionButton";
import { 
  TrendingUp, 
  Shield, 
  BarChart3, 
  DollarSign, 
  Calendar,
  PieChart,
  FileText,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Lock,
  Building2,
  User,
  Receipt,
  Calculator,
  Target,
  Zap
} from "lucide-react";

export default function GuestPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"pourquoi" | "fonctionnalites" | "tarif">("pourquoi");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  
  // Utiliser useAuth de manière sécurisée
  let currentUser = null;
  let loading = false;
  try {
    const auth = useAuth();
    currentUser = auth?.currentUser || null;
    loading = auth?.loading || false;
  } catch (error) {
    currentUser = null;
    loading = false;
  }

  // Utiliser useSubscription de manière sécurisée
  let subscription = null;
  let planType = "free" as "free" | "ia" | "pro";
  try {
    const sub = useSubscription();
    subscription = sub?.subscription || null;
    planType = sub?.planType || "free";
  } catch (error) {
    subscription = null;
    planType = "free";
  }

  // Rediriger les utilisateurs connectés vers le dashboard
  useEffect(() => {
    if (!loading && currentUser) {
      navigate("/dashboard", { replace: true });
    }
  }, [currentUser, loading, navigate]);

  // Gérer les ancres dans l'URL
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash === "pourquoi" || hash === "fonctionnalites" || hash === "tarif") {
      setActiveTab(hash as "pourquoi" | "fonctionnalites" | "tarif");
    }
  }, []);

  const features = [
    {
      icon: BarChart3,
      title: "Tableau de bord intelligent",
      description: "Visualisez vos finances en temps réel avec des graphiques interactifs, analyses de tendances et indicateurs de performance. Suivez vos revenus, dépenses et revenu net avec une précision totale."
    },
    {
      icon: Building2,
      title: "Gestion dual-mode",
      description: "Séparez facilement vos finances personnelles et professionnelles. Basculez entre les deux modes en un clic pour une gestion complète de votre patrimoine."
    },
    {
      icon: Calculator,
      title: "Calcul fiscal automatique",
      description: "Calcul automatique des taxes GST/QST, crédits d'impôt (ITC), et suivi des dépenses déductibles. Préparez vos déclarations fiscales en toute simplicité."
    },
    {
      icon: DollarSign,
      title: "Budget intelligent",
      description: "Créez des budgets personnalisés avec dépenses fixes récurrentes et variables. Visualisez vos prévisions sur un calendrier annuel et suivez votre progression en temps réel."
    },
    {
      icon: Receipt,
      title: "Suivi transactionnel avancé",
      description: "Enregistrez toutes vos transactions avec catégorisation automatique, tags personnalisés, et support multi-comptes. Gérez les transferts, remboursements et paiements de factures."
    },
    {
      icon: PieChart,
      title: "Analyses par catégorie",
      description: "Analysez vos dépenses par catégorie avec des graphiques en camembert. Identifiez vos principales sources de dépenses et optimisez votre budget en conséquence."
    },
    {
      icon: Target,
      title: "Objectifs d'épargne",
      description: "Définissez des objectifs d'épargne avec calculateur intégré. Déterminez combien épargner par période (hebdomadaire, bi-mensuel, mensuel) pour atteindre vos objectifs."
    },
    {
      icon: FileText,
      title: "Rapports détaillés",
      description: "Générez des rapports complets pour vos déclarations fiscales. Exportez vos données et préparez vos documents comptables en quelques clics."
    },
    {
      icon: Shield,
      title: "Sécurité de niveau bancaire",
      description: "Vos données sont chiffrées et stockées de manière sécurisée sur Firebase. Authentification robuste et conformité RGPD garanties."
    }
  ];

  const useCases = [
    {
      title: "Pour les travailleurs autonomes",
      description: "Gérez vos revenus, dépenses déductibles, taxes et préparez vos déclarations fiscales avec facilité.",
      icon: Building2
    },
    {
      title: "Pour les particuliers",
      description: "Suivez votre budget personnel, planifiez vos épargnes et contrôlez vos dépenses au quotidien.",
      icon: User
    },
    {
      title: "Pour les entrepreneurs",
      description: "Séparez vos finances d'entreprise et personnelles, suivez vos performances et optimisez votre fiscalité.",
      icon: TrendingUp
    }
  ];

  const benefits = [
    "Gestion séparée entreprise et personnel avec basculement instantané",
    "Calcul automatique des taxes GST/QST et crédits d'impôt (ITC)",
    "Suivi des dépenses déductibles (véhicule, bureau à domicile, technologie)",
    "Interface intuitive et moderne avec design responsive",
    "Planification budgétaire avec calendrier visuel",
    "Objectifs d'épargne avec calculateur intégré"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a273f] backdrop-blur-md border-b border-border/40 overflow-visible">
        <div className="container mx-auto px-6 py-0">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src="/logo_nova.svg" 
                alt="NovaFinance Logo" 
                className="h-40 w-auto -my-6 transition-transform group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/logo_nova_st.png";
                  target.onerror = () => {
                    target.src = "/Logobleu.png";
                  };
                }}
              />
            </Link>
            <nav className="flex items-center gap-6">
              <button 
                onClick={() => setActiveTab("pourquoi")}
                className={`transition-colors font-medium text-sm ${
                  activeTab === "pourquoi" 
                    ? "text-white border-b-2 border-white pb-1" 
                    : "text-white/90 hover:text-white"
                }`}
              >
                Pourquoi ?
              </button>
              <button 
                onClick={() => setActiveTab("fonctionnalites")}
                className={`transition-colors font-medium text-sm ${
                  activeTab === "fonctionnalites" 
                    ? "text-white border-b-2 border-white pb-1" 
                    : "text-white/90 hover:text-white"
                }`}
              >
                Fonctionnalité
              </button>
              <button 
                onClick={() => setActiveTab("tarif")}
                className={`transition-colors font-medium text-sm ${
                  activeTab === "tarif" 
                    ? "text-white border-b-2 border-white pb-1" 
                    : "text-white/90 hover:text-white"
                }`}
              >
                Tarif
              </button>
              {currentUser ? (
                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#047cba] to-[#03c0db] text-white rounded-lg hover:from-[#0075c8] hover:to-[#047cba] transition-all font-medium text-sm shadow-md"
                >
                  Tableau de bord
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-white/90 hover:text-white transition-colors font-medium text-sm"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/login"
                    className="px-5 py-2.5 bg-gradient-to-r from-[#047cba] to-[#03c0db] text-white rounded-lg hover:from-[#0075c8] hover:to-[#047cba] transition-all font-medium text-sm shadow-md"
                  >
                    Créer un compte
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - Only visible in "pourquoi" tab */}
      {activeTab === "pourquoi" && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="container mx-auto px-6 py-6 md:py-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left side - Title, text and buttons */}
              <div className="flex flex-col justify-center items-center text-center h-full">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#047cba]/10 border border-[#047cba]/20 rounded-full mb-4">
                  <Zap className="w-3.5 h-3.5 text-[#047cba]" />
                  <span className="text-xs font-medium bg-gradient-to-r from-[#047cba] to-[#03c0db] bg-clip-text text-transparent">Solution financière pour le Québec</span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground leading-tight">
                  Maîtrisez vos finances
                  <br />
                  <span className="bg-gradient-to-r from-[#047cba] via-[#03c0db] to-[#0075c8] bg-clip-text text-transparent">en toute simplicité</span>
                </h1>
                <p className="text-sm md:text-base text-muted-foreground mb-5 max-w-lg leading-relaxed">
                  Gestion budgétaire, suivi transactionnel, calcul fiscal automatique et analyses détaillées. 
                  Tout ce dont vous avez besoin pour vos finances personnelles et professionnelles.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  {!currentUser && (
                    <Link
                      to="/login"
                      className="px-7 py-2.5 bg-gradient-to-r from-[#047cba] to-[#03c0db] text-white rounded-lg hover:from-[#0075c8] hover:to-[#047cba] transition-all font-semibold text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      Commencer gratuitement
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                  <Link
                    to="/privacy"
                    className="px-7 py-2.5 bg-background border border-border rounded-lg hover:bg-accent transition-all font-medium text-sm"
                  >
                    En savoir plus
                  </Link>
                </div>
              </div>
              
              {/* Right side - Benefits */}
              <div className="lg:sticky lg:top-20 border border-border rounded-lg p-4 bg-card">
                <h3 className="text-2xl font-bold mb-4 text-foreground">Pourquoi NovaFinance ?</h3>
                <div className="space-y-2">
                  {benefits.map((benefit, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-2 bg-card rounded-lg p-3 border border-border"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#047cba] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">{benefit}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tabs Section */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            {/* Tab Content */}
            <div className="p-6 md:p-8">
              {activeTab === "pourquoi" && (
                <div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left - Conçu pour tous vos besoins */}
                    <div className="border border-border rounded-xl p-4 flex flex-col">
                      <div className="flex items-center justify-center gap-3 mb-3 h-[60px]">
                        <div className="w-10 h-10 bg-[#047cba]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Target className="w-5 h-5 text-[#047cba]" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Conçu pour tous vos besoins</h2>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {useCases.map((useCase, index) => {
                          const Icon = useCase.icon;
                          return (
                            <div
                              key={index}
                              className="bg-background rounded-xl p-2 hover:bg-muted/50 transition-all flex items-start gap-3"
                            >
                              <div className="w-10 h-10 bg-[#047cba]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Icon className="w-5 h-5 text-[#047cba]" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-base font-bold mb-0.5 text-foreground">{useCase.title}</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">{useCase.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Right - Sécurité et confidentialité */}
                    <div className="p-4 flex flex-col">
                      <div className="flex items-center justify-center gap-3 mb-3 h-[60px]">
                        <div className="w-10 h-10 bg-[#047cba]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Lock className="w-5 h-5 text-[#047cba]" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Sécurité et confidentialité</h2>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="bg-background rounded-xl p-2 hover:bg-muted/50 transition-all flex items-start gap-3">
                          <div className="w-10 h-10 bg-[#047cba]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-[#047cba]" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-bold mb-0.5 text-foreground">Chiffrement des données</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Toutes vos données sont chiffrées en transit et au repos
                            </p>
                          </div>
                        </div>
                        <div className="bg-background rounded-xl p-2 hover:bg-muted/50 transition-all flex items-start gap-3">
                          <div className="w-10 h-10 bg-[#047cba]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Smartphone className="w-5 h-5 text-[#047cba]" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-bold mb-0.5 text-foreground">Accès sécurisé</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Authentification sécurisée avec Firebase Authentication
                            </p>
                          </div>
                        </div>
                        <div className="bg-background rounded-xl p-2 hover:bg-muted/50 transition-all flex items-start gap-3">
                          <div className="w-10 h-10 bg-[#047cba]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-[#047cba]" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-bold mb-0.5 text-foreground">Conforme RGPD</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Respect de la réglementation sur la protection des données
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-4 text-center">
                        Vos données sont protégées avec les meilleures pratiques de sécurité
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "fonctionnalites" && (
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">Fonctionnalités complètes</h2>
                    <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                      Tout ce dont vous avez besoin pour une gestion financière professionnelle
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <div
                          key={index}
                          className="group bg-background rounded-lg p-4 border border-border hover:border-[#047cba] hover:bg-gradient-to-br hover:from-[#047cba]/5 hover:via-[#03c0db]/5 hover:to-[#0075c8]/5 transition-all cursor-pointer"
                        >
                          <div className="w-8 h-8 bg-[#047cba]/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#047cba]/20 transition-colors">
                            <Icon className="w-4 h-4 text-[#047cba]" />
                          </div>
                          <h3 className="text-base font-semibold mb-2 text-foreground">{feature.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Left - Title and subtitle */}
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">Prêt à commencer ?</h2>
                      <p className="text-sm text-muted-foreground">
                        Rejoignez NovaFinance et découvrez comment simplifier vos finances. 
                        Gratuit, sécurisé et conçu pour le Québec.
                      </p>
                    </div>
                    {/* Right - Button and info */}
                    <div className="flex flex-col items-center lg:items-end gap-4">
                      {!currentUser && (
                        <Link
                          to="/login"
                          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#047cba] to-[#03c0db] text-white rounded-lg hover:from-[#0075c8] hover:to-[#047cba] transition-all font-semibold text-base shadow-md hover:shadow-lg"
                        >
                          Commencer gratuitement
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Aucune carte de crédit requise • Configuration en 2 minutes
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "tarif" && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">Tarif</h2>
                    <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-4">
                      Choisissez le plan qui correspond à vos besoins. Tous les plans incluent un essai gratuit de 14 jours.
                    </p>
                    {/* Sélecteur mensuel/annuel */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <button
                        onClick={() => setBillingPeriod("monthly")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          billingPeriod === "monthly"
                            ? "bg-gradient-to-r from-[#047cba] to-[#03c0db] text-white"
                            : "bg-background border border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        Mensuel
                      </button>
                      <button
                        onClick={() => setBillingPeriod("yearly")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          billingPeriod === "yearly"
                            ? "bg-gradient-to-r from-[#047cba] to-[#03c0db] text-white"
                            : "bg-background border border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        Annuel <span className="text-xs opacity-90">(20% d'économie)</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {/* Plan Gratuit */}
                    <div className="bg-background rounded-xl p-6 border border-border flex flex-col">
                      <div className="text-3xl font-bold bg-gradient-to-r from-[#047cba] to-[#03c0db] bg-clip-text text-transparent mb-1">Gratuit</div>
                      <p className="text-muted-foreground text-sm mb-4">Pour toujours</p>
                      <ul className="text-left space-y-2 mb-6 flex-1">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#047cba] flex-shrink-0 mt-0.5" />
                          <span className="text-xs">Transactions illimitées</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#047cba] flex-shrink-0 mt-0.5" />
                          <span className="text-xs">Budgets de base</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#047cba] flex-shrink-0 mt-0.5" />
                          <span className="text-xs">Support communautaire</span>
                        </li>
                      </ul>
                      {!currentUser && (
                        <Link
                          to="/login"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-background border border-border rounded-lg hover:bg-accent transition-all font-medium text-sm w-full"
                        >
                          Commencer gratuitement
                        </Link>
                      )}
                    </div>

                    {/* Plan IA */}
                    <div className="bg-background rounded-xl p-6 border-2 border-[#047cba] flex flex-col relative">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#047cba] text-white text-xs px-3 py-1 rounded-full font-medium">Populaire</div>
                      <div className="mt-2">
                        <div className="text-3xl font-bold text-foreground mb-1">
                          {billingPeriod === "monthly" ? "4,99 $" : "47,90 $"}
                        </div>
                        <p className="text-muted-foreground text-xs mb-1">
                          {billingPeriod === "monthly" ? "par mois" : "par an"}
                        </p>
                        {billingPeriod === "monthly" && (
                          <p className="text-[#047cba] text-xs font-medium mb-4">47,90 $/an (20% d'économie)</p>
                        )}
                      </div>
                      <ul className="text-left space-y-2 mb-6 flex-1">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#047cba] flex-shrink-0 mt-0.5" />
                          <span className="text-xs">Tout du plan Gratuit</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#047cba] flex-shrink-0 mt-0.5" />
                          <span className="text-xs">Assistant IA pour l'épargne</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#047cba] flex-shrink-0 mt-0.5" />
                          <span className="text-xs">Suggestions intelligentes</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#047cba] flex-shrink-0 mt-0.5" />
                          <span className="text-xs">Calculateur d'objectifs d'épargne</span>
                        </li>
                      </ul>
                      {currentUser ? (
                        <SubscriptionButton
                          planType="ia"
                          billingPeriod={billingPeriod}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#047cba] to-[#03c0db] text-white rounded-lg hover:from-[#0075c8] hover:to-[#047cba] transition-all font-semibold text-sm w-full shadow-md"
                        >
                          {planType === "ia" ? "Plan actuel" : planType === "pro" ? "Plan supérieur actif" : "S'abonner"}
                          {planType !== "ia" && planType !== "pro" && <ArrowRight className="w-4 h-4" />}
                        </SubscriptionButton>
                      ) : (
                        <Link
                          to="/login"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#047cba] to-[#03c0db] text-white rounded-lg hover:from-[#0075c8] hover:to-[#047cba] transition-all font-semibold text-sm w-full shadow-md"
                        >
                          Essayer gratuitement
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>

                    {/* Plan Pro */}
                    <div className="bg-background rounded-xl p-6 border border-border flex flex-col">
                      <div className="text-3xl font-bold text-foreground mb-1">
                        {billingPeriod === "monthly" ? "9,99 $" : "95,90 $"}
                      </div>
                      <p className="text-muted-foreground text-xs mb-1">
                        {billingPeriod === "monthly" ? "par mois" : "par an"}
                      </p>
                      {billingPeriod === "monthly" && (
                        <p className="text-[#047cba] text-xs font-medium mb-4">95,90 $/an (20% d'économie)</p>
                      )}
                      <ul className="text-left space-y-2 mb-6 flex-1">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#047cba] flex-shrink-0 mt-0.5" />
                          <span className="text-xs">Tout du plan IA</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#047cba] flex-shrink-0 mt-0.5" />
                          <span className="text-xs">Calcul fiscal avancé (GST/QST)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#047cba] flex-shrink-0 mt-0.5" />
                          <span className="text-xs">Rapports fiscaux détaillés</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#047cba] flex-shrink-0 mt-0.5" />
                          <span className="text-xs">Export illimité</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#047cba] flex-shrink-0 mt-0.5" />
                          <span className="text-xs">Support prioritaire</span>
                        </li>
                      </ul>
                      {currentUser ? (
                        <SubscriptionButton
                          planType="pro"
                          billingPeriod={billingPeriod}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#047cba] to-[#03c0db] text-white rounded-lg hover:from-[#0075c8] hover:to-[#047cba] transition-all font-semibold text-sm w-full shadow-md"
                        >
                          {planType === "pro" ? "Plan actuel" : planType === "ia" ? "Mettre à niveau" : "S'abonner"}
                          {planType !== "pro" && <ArrowRight className="w-4 h-4" />}
                        </SubscriptionButton>
                      ) : (
                        <Link
                          to="/login"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#047cba] to-[#03c0db] text-white rounded-lg hover:from-[#0075c8] hover:to-[#047cba] transition-all font-semibold text-sm w-full shadow-md"
                        >
                          Essayer gratuitement
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 bg-background">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo_nova_st.png" 
                alt="NovaFinance" 
                className="h-12 w-auto opacity-60"
              />
              <p className="text-sm text-muted-foreground">© 2025 NovaFinance. Tous droits réservés.</p>
            </div>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Confidentialité
              </Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Conditions
              </Link>
              <a href="mailto:info@guillaumehetu.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

