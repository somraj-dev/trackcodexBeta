import React from "react";
import { Outlet } from "react-router-dom";

const MarketplaceLayout = () => {
  return (
    <div className="flex-1 flex flex-col bg-gh-bg font-display">
      <header className="p-8 border-b border-gh-border">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gh-text tracking-tight mb-2">
                Marketplace
              </h1>
              <p className="text-sm text-gh-text-secondary max-w-2xl leading-relaxed">
                Discover high-value missions and collaborate with top engineering teams.
              </p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default MarketplaceLayout;


