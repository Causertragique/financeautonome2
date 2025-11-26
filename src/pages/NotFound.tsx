import React from "react";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { Home, ArrowRight } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="text-center">
          <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t("notFound.title")}
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md">
            {t("notFound.message")}
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            <Home className="w-5 h-5" />
            <span>{t("notFound.backToDashboard")}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
