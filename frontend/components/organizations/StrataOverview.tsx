import React from 'react';
import { Strata } from '../../types';
import { useOutletContext } from 'react-router-dom';
import '../../styles/StrataDashboard.css';

const QuickActionCard: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <div className="quick-action-card">
    <span className="material-symbols-outlined !text-[20px]">{icon}</span>
    {label}
  </div>
);

const MonitorCard: React.FC<{ 
  title: string; 
  value: string; 
  badge?: string; 
  badgeType?: 'red' | 'green';
  actionLabel: string;
  charts?: React.ReactNode;
}> = ({ title, value, badge, badgeType, actionLabel, charts }) => (
  <div className="monitor-card">
    <div className="monitor-card-header">
      <h3 className="monitor-card-title">{title}</h3>
      <button className="btn-monitor-action">{actionLabel}</button>
    </div>
    <div className="monitor-value-container">
      <span className="monitor-value">{value}</span>
      {badge && (
        <span className={`monitor-badge ${badgeType === 'red' ? 'monitor-badge-red' : ''}`}>
          {badge}
        </span>
      )}
    </div>
    <div className="monitor-chart-placeholder">
      {charts || (
        <svg className="sparkline-svg" viewBox="0 0 100 40">
          <path d="M0,35 Q20,30 40,35 T80,25 T100,30" />
          <line x1="0" y1="38" x2="100" y2="38" className="chart-grid-libs" />
        </svg>
      )}
    </div>
  </div>
);

const StrataOverview = () => {
    const { strata } = useOutletContext<{ strata: Strata }>();

    return (
        <div className="strata-dashboard animate-in fade-in duration-500">
            {/* Quick Actions */}
            <section className="strata-dashboard-section">
                <h2 className="strata-dashboard-section-title">Quick actions</h2>
                <div className="quick-actions-grid">
                    <QuickActionCard icon="person_add" label="Invite users" />
                    <QuickActionCard icon="apps" label="Add app" />
                    <QuickActionCard icon="language" label="Verify domain" />
                </div>
            </section>

            {/* Monitor Section */}
            <section className="strata-dashboard-section">
                <h2 className="strata-dashboard-section-title">Monitor</h2>
                <div className="monitor-grid">
                    <MonitorCard 
                      title="Rovo credits usage" 
                      value="0" 
                      actionLabel="View usage" 
                      charts={
                        <svg className="sparkline-svg" viewBox="0 0 400 120">
                          {/* Grid Lines */}
                          <line x1="0" y1="20" x2="400" y2="20" className="chart-grid-libs" />
                          <line x1="0" y1="50" x2="400" y2="50" className="chart-grid-libs" />
                          <line x1="0" y1="80" x2="400" y2="80" className="chart-grid-libs" />
                          <line x1="0" y1="110" x2="400" y2="110" className="chart-grid-libs" />
                          
                          {/* Path */}
                          <path 
                            d="M10,110 L80,110 L150,110 L220,110 L290,110 L360,110" 
                            stroke="#1f6feb" 
                            strokeWidth="3" 
                            fill="none" 
                          />
                          
                          {/* Markers */}
                          <circle cx="10" cy="110" r="4" fill="#1f6feb" />
                          <circle cx="80" cy="110" r="4" fill="#1f6feb" />
                          <circle cx="150" cy="110" r="4" fill="#1f6feb" />
                          <circle cx="220" cy="110" r="4" fill="#1f6feb" />
                          <circle cx="290" cy="110" r="4" fill="#1f6feb" />
                          <circle cx="360" cy="110" r="4" fill="#1f6feb" />
                          
                          {/* Labels */}
                          <text x="5" y="118" className="chart-axis-label">Mar 22</text>
                          <text x="75" y="118" className="chart-axis-label">Mar 23</text>
                          <text x="145" y="118" className="chart-axis-label">Mar 24</text>
                        </svg>
                      }
                    />
                    <MonitorCard 
                      title="Monthly active users" 
                      value="0" 
                      badge="0% MONTH TO DATE" 
                      badgeType="red"
                      actionLabel="Manage users" 
                    />
                    <MonitorCard 
                      title="Open requests for app access" 
                      value="0" 
                      actionLabel="Manage requests" 
                    />
                </div>
            </section>
        </div>
    );
};

export default StrataOverview;
