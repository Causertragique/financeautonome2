import React, { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useFiscalYearContext } from "../contexts/FiscalYearContext";
import { useUsageMode } from "../contexts/UsageModeContext";
import {
  BarChart3,
  Building2,
  DollarSign,
  FileText,
  Menu,
  Settings,
  X,
  TrendingUp,
  FileBarChart,
  Bell,
  Search,
  User,
  ChevronDown,
  Calculator,
  LogOut,
  AlertTriangle,
  Package,
  Wallet,
  CreditCard,
  PiggyBank,
  Target,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { t } = useLanguage();
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileImageError, setProfileImageError] = useState(false);
  const location = useLocation();
  const { selectedYear, setSelectedYear, availableYears } = useFiscalYearContext();
  const { usageType, currentMode, setCurrentMode } = useUsageMode();

  // Réinitialiser l'erreur d'image quand la photoURL change
  useEffect(() => {
    setProfileImageError(false);
  }, [currentUser?.photoURL]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès.",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la déconnexion.",
        variant: "destructive",
      });
    }
  };

  // Navigation items pour entreprise
  const businessNavigationItems = [
    {
      name: t("sidebar.dashboard"),
      href: "/",
      icon: BarChart3,
    },
    {
      name: t("sidebar.companies"),
      href: "/companies",
      icon: Building2,
    },
    {
      name: t("sidebar.transactions"),
      href: "/transactions",
      icon: DollarSign,
    },
    {
      name: t("sidebar.accounting"),
      href: "/accounting",
      icon: Calculator,
    },
    {
      name: t("sidebar.taxFiling"),
      href: "/tax-filing",
      icon: FileBarChart,
    },
    {
      name: t("sidebar.reports"),
      href: "/reports",
      icon: FileText,
    },
    {
      name: t("sidebar.anomalies"),
      href: "/anomalies",
      icon: AlertTriangle,
    },
    {
      name: t("sidebar.assets"),
      href: "/assets",
      icon: Package,
    },
    {
      name: t("sidebar.settings"),
      href: "/settings",
      icon: Settings,
    },
  ];

  // Navigation items pour finance personnelle
  const personalNavigationItems = [
    {
      name: "Tableau de bord",
      href: "/",
      icon: BarChart3,
    },
    {
      name: "Transactions",
      href: "/transactions",
      icon: DollarSign,
    },
    {
      name: "Budget",
      href: "/budget",
      icon: Target,
    },
    {
      name: "Comptes",
      href: "/accounts",
      icon: Wallet,
    },
    {
      name: "Cartes",
      href: "/cards",
      icon: CreditCard,
    },
    {
      name: "Épargne",
      href: "/savings",
      icon: PiggyBank,
    },
    {
      name: "Rapports",
      href: "/reports",
      icon: FileText,
    },
    {
      name: "Paramètres",
      href: "/settings",
      icon: Settings,
    },
  ];

  // Déterminer quelle navigation utiliser
  const getNavigationItems = () => {
    if (usageType === "personal" || (usageType === "both" && currentMode === "personal")) {
      return personalNavigationItems;
    }
    return businessNavigationItems;
  };

  const navigationItems = getNavigationItems();

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-72" : "w-20"
        } bg-[hsl(222.2,47.4%,11.2%)] text-white transition-all duration-300 border-r border-[hsl(217.2,32.6%,20%)] flex flex-col shadow-xl h-screen overflow-hidden`}
      >
        {/* Logo/Brand */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-sidebar-border/50">
          <div className="flex items-center justify-center w-full">
            <img 
              src="/logo_nova.svg" 
              alt="NovaFinance" 
              className={`${sidebarOpen ? "h-72" : "h-48"} object-contain transition-all`}
            />
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white/90 hover:bg-white/10 rounded-lg p-2 transition-all hover:text-white"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-hidden">
          {/* Switch pour basculer entre personnelle et entreprise (si usageType = "both") */}
          {sidebarOpen && usageType === "both" && (
            <div className="mb-4 px-4">
              <div className="bg-white/10 border border-white/20 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mode-switch" className="text-white text-sm font-medium cursor-pointer">
                    {currentMode === "business" ? "Entreprise" : "Personnelle"}
                  </Label>
                  <Switch
                    id="mode-switch"
                    checked={currentMode === "personal"}
                    onCheckedChange={(checked) => setCurrentMode(checked ? "personal" : "business")}
                    className="data-[state=checked]:bg-sidebar-primary"
                  />
                </div>
                <p className="text-xs text-white/70">
                  {currentMode === "business" 
                    ? "Mode entreprise actif" 
                    : "Mode finance personnelle actif"}
                </p>
              </div>
            </div>
          )}
          
          {/* Sélecteur d'année fiscale (uniquement pour entreprise) */}
          {sidebarOpen && (usageType === "business" || (usageType === "both" && currentMode === "business")) && (
            <div className="mb-4 px-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sidebar-primary cursor-pointer hover:bg-white/15 transition-colors"
                aria-label="Sélectionner l'année fiscale"
                title="Sélectionner l'année fiscale"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year} className="bg-[hsl(222.2,47.4%,11.2%)]">
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  active
                    ? "bg-sidebar-primary/30 text-white shadow-lg shadow-sidebar-primary/20"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sidebar-primary rounded-r-full" />
                )}
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-transform ${
                    active 
                      ? "scale-110 text-white" 
                      : "group-hover:scale-110 text-white/90 group-hover:text-white"
                  }`}
                />
                {sidebarOpen && (
                  <span
                    className={`text-sm font-medium transition-all ${
                      active ? "font-semibold text-white" : "text-white/90 group-hover:text-white"
                    }`}
                  >
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-sidebar-border/50">
            <div className="bg-gradient-to-br from-sidebar-accent/15 to-sidebar-primary/10 rounded-2xl p-4 border border-sidebar-border/30 shadow-lg">
              <p className="text-xs font-bold text-white mb-1.5">
                {t("sidebar.footer")}
              </p>
              <p className="text-xs text-white/80 font-medium">
                {t("sidebar.footerTagline")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Top Bar */}
        <div className="h-20 bg-card/80 backdrop-blur-xl border-b border-border/50 px-8 flex items-center justify-between shadow-sm">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("header.search")}
                className="w-full pl-12 pr-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-6">
            <button 
              type="button" 
              aria-label="Notifications"
              className="relative text-foreground/70 hover:text-foreground transition-colors p-2 hover:bg-muted/50 rounded-lg"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-card" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 pl-4 border-l border-border hover:opacity-80 transition-opacity cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                    {currentUser?.photoURL && !profileImageError ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt={currentUser.displayName || "User"} 
                        className="w-10 h-10 rounded-full object-cover"
                        onError={() => setProfileImageError(true)}
                      />
                    ) : (
                <User className="w-5 h-5 text-primary-foreground" />
                    )}
              </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-foreground">
                      {currentUser?.displayName || currentUser?.email || t("header.user")}
                    </span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  {t("sidebar.settings")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-muted/10">
          <div className="p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
