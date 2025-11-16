import React, { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { Save, Shield, Bell, Palette, Users, CreditCard, Globe } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: t("settings.general"), icon: <Palette className="w-5 h-5" /> },
    { id: "account", label: t("settings.account"), icon: <Users className="w-5 h-5" /> },
    {
      id: "notifications",
      label: t("settings.notifications"),
      icon: <Bell className="w-5 h-5" />,
    },
    { id: "billing", label: t("settings.billing"), icon: <CreditCard className="w-5 h-5" /> },
    { id: "security", label: t("settings.security"), icon: <Shield className="w-5 h-5" /> },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t("settings.title")}</h1>
        <p className="text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border border-border p-2 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {tab.icon}
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            {activeTab === "general" && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  {t("settings.generalSettings")}
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      {t("settings.language")}
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      {t("settings.languageDescription")}
                    </p>
                    <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-xl p-4">
                      <Globe className="w-5 h-5 text-primary" />
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as "fr" | "en")}
                        className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      {t("settings.defaultCurrency")}
                    </label>
                    <select className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>{t("settings.currencyCAD")}</option>
                      <option>{t("settings.currencyUSD")}</option>
                      <option>{t("settings.currencyEUR")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      {t("settings.fiscalYearStart")}
                    </label>
                    <select className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>{t("settings.monthJanuary")}</option>
                      <option>{t("settings.monthApril")}</option>
                      <option>{t("settings.monthJuly")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      {t("settings.theme")}
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="theme" defaultChecked />
                        <span className="text-sm text-foreground">{t("settings.themeLight")}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="theme" />
                        <span className="text-sm text-foreground">{t("settings.themeDark")}</span>
                      </label>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium">
                    <Save className="w-5 h-5" />
                    <span>{t("settings.save")}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "account" && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  {t("settings.accountSettings")}
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      {t("settings.fullName")}
                    </label>
                    <input
                      type="text"
                      defaultValue="John Doe"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      {t("settings.email")}
                    </label>
                    <input
                      type="email"
                      defaultValue="john@example.com"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      {t("settings.phone")}
                    </label>
                    <input
                      type="tel"
                      defaultValue="+1 (555) 000-0000"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium">
                    <Save className="w-5 h-5" />
                    <span>{t("settings.updateAccount")}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  {t("settings.notificationPreferences")}
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      title: t("settings.taxDeadlineReminders"),
                      description: t("settings.taxDeadlineDesc"),
                    },
                    {
                      title: t("settings.monthlyReports"),
                      description: t("settings.monthlyReportsDesc"),
                    },
                    {
                      title: t("settings.largeTransactions"),
                      description: t("settings.largeTransactionsDesc"),
                    },
                    {
                      title: t("settings.systemUpdates"),
                      description: t("settings.systemUpdatesDesc"),
                    },
                  ].map((notif, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {notif.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {notif.description}
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  {t("settings.billingSubscription")}
                </h2>
                <div className="space-y-6">
                  <div className="p-4 border border-border rounded-lg bg-secondary/30">
                    <p className="text-sm text-muted-foreground mb-1">
                      {t("settings.currentPlan")}
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {t("settings.professional")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      $49/month billed annually
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      {t("settings.paymentMethod")}
                    </h3>
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                          VISA
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Visa ending in 4242
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expires 12/2025
                          </p>
                        </div>
                      </div>
                      <button className="text-primary hover:text-primary/80 font-medium">
                        {t("settings.edit")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  {t("settings.security")}
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      {t("settings.changePassword")}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-2">
                          {t("settings.currentPassword")}
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-2">
                          {t("settings.newPassword")}
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-2">
                          {t("settings.confirmPassword")}
                        </label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium">
                        <Save className="w-5 h-5" />
                        <span>{t("settings.updatePassword")}</span>
                      </button>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      {t("settings.twoFactorAuth")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("settings.twoFactorDesc")}
                    </p>
                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium">
                      <Shield className="w-5 h-5" />
                      <span>{t("settings.enable2FA")}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
