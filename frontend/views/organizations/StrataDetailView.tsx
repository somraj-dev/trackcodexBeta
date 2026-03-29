import React, { useState } from "react";
import { useParams, NavLink, Outlet, useLocation } from "react-router-dom";
import { MOCK_STRATA } from "../../constants";
import "../../styles/StrataDashboard.css";

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
  end?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `strata-nav-item ${isActive ? "active" : ""}`
    }
  >
    <span className="material-symbols-outlined strata-nav-item-icon">{icon}</span>
    <span className="flex-1">{label}</span>
  </NavLink>
);

const CollapsibleNavItem: React.FC<{
  icon: string;
  label: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ icon, label, children, isOpen, onToggle }) => {
  return (
    <div className="flex flex-col">
      <div 
        className={`strata-nav-item ${isOpen ? "active-parent" : ""}`}
        onClick={onToggle}
      >
        <span className="material-symbols-outlined strata-nav-item-icon">{icon}</span>
        <span className="flex-1">{label}</span>
        <span className={`material-symbols-outlined strata-nav-chevron ${isOpen ? "expanded" : ""}`}>
          expand_more
        </span>
      </div>
      <div 
        className={`strata-nav-submenu ${isOpen ? "open" : "closed"}`} 
      >
        {children}
      </div>
    </div>
  );
};

const StrataDetailView = () => {
  const { strataId } = useParams();
  const location = useLocation();
  const strata = MOCK_STRATA.find((o) => o.id === strataId);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(true);

  if (!strata) {
    return (
      <div className="p-8 text-center text-slate-400">
        Strata not found.
      </div>
    );
  }

  return (
    <div className="strata-layout-container font-display">
      {/* Vertical Sidebar */}
      <aside className="strata-sidebar custom-scrollbar">
        <div className="strata-sidebar-content">
          {/* Org Header */}
          <div className="strata-sidebar-org">
            <img
              src={strata.avatar}
              alt={strata.name}
              className="size-8 object-cover"
            />
            <span className="strata-sidebar-org-name">{strata.name}</span>
          </div>

          {/* Navigation List */}
          <nav className="strata-nav-list">
            <NavItem 
              to={`/strata/${strataId}`} 
              icon="space_dashboard" 
              label="Overview" 
              end 
            />

            <CollapsibleNavItem 
              icon="folder_shared" 
              label="Directory" 
              isOpen={isDirectoryOpen}
              onToggle={() => setIsDirectoryOpen(!isDirectoryOpen)}
            >
              <NavLink to={`/strata/${strataId}/users`} className={({ isActive }) => `strata-nav-submenu-item ${isActive ? "active" : ""}`}>Users</NavLink>
              <NavLink to={`/strata/${strataId}/groups`} className={({ isActive }) => `strata-nav-submenu-item ${isActive ? "active" : ""}`}>Groups</NavLink>
              <NavLink to={`/strata/${strataId}/teams`} className={({ isActive }) => `strata-nav-submenu-item ${isActive ? "active" : ""}`}>Teams</NavLink>
              <NavLink to={`/strata/${strataId}/managed-accounts`} className={({ isActive }) => `strata-nav-submenu-item ${isActive ? "active" : ""}`}>Managed accounts</NavLink>
              <NavLink to={`/strata/${strataId}/service-accounts`} className={({ isActive }) => `strata-nav-submenu-item ${isActive ? "active" : ""}`}>Service accounts</NavLink>
              <NavLink to={`/strata/${strataId}/domains`} className={({ isActive }) => `strata-nav-submenu-item ${isActive ? "active" : ""}`}>Domains</NavLink>
            </CollapsibleNavItem>

            <NavItem to="apps" icon="apps" label="Apps" />
            <NavItem to="security" icon="shield" label="Security" />
            <NavItem to="data-management" icon="database" label="Data management" />
            <NavItem to="insights" icon="insights" label="Insights" />
            <NavItem to="billing" icon="payments" label="Billing" />
            <NavItem to="settings" icon="settings" label="Organisation settings" />
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="strata-main-content">
        <div className="p-8 max-w-[1400px] mx-auto w-full">
          <Outlet context={{ strata }} />
        </div>
      </main>
    </div>
  );
};

export default StrataDetailView;
