import React from "react";
import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import { CookieConsent } from "../legal/CookieConsent";

const PublicLayout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
        <Outlet />
        <Footer />
      </main>
      <CookieConsent />
    </div>
  );
};

export default PublicLayout;
