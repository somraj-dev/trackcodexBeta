import React, { useState, useEffect } from "react";

interface SecurityFeature {
    id: string;
    title: string;
    description: string;
    enabled: boolean;
    autoEnable: boolean;
}

const AhiCsSettings = () => {
    // --- Existing Security Settings ---
    const [pushProtection, setPushProtection] = useState(false);
    const [privateVulnerability, setPrivateVulnerability] = useState({
        enabled: false,
        autoEnable: false,
    });
    const [dependencyGraph, setDependencyGraph] = useState({
        enabled: false,
        autoEnable: false,
    });
    const [dependabotAlerts, setDependabotAlerts] = useState({
        enabled: false,
        autoEnable: false,
    });
    const [dependabotSecurityUpdates, setDependabotSecurityUpdates] = useState({
        enabled: false,
        autoEnable: false,
    });
    const [groupedSecurityUpdates, setGroupedSecurityUpdates] = useState({
        enabled: false,
        autoEnable: false,
    });
    const [dependabotSelfHosted, setDependabotSelfHosted] = useState({
        enabled: false,
        autoEnable: false,
    });

    // --- CSS & AHI Settings ---
    const [cssEnabled, setCssEnabled] = useState(true);
    const [cssAutoScan, setCssAutoScan] = useState(true);
    const [cssMergeGate, setCssMergeGate] = useState(true);
    const [cssScoreThreshold, setCssScoreThreshold] = useState(70);
    const [cssMaxParallelScans, setCssMaxParallelScans] = useState(5);

    const [ahiEnabled, setAhiEnabled] = useState(true);
    const [ahiAutoValidate, setAhiAutoValidate] = useState(true);
    const [ahiMinConfidence, setAhiMinConfidence] = useState(0.5);

    const [shannonEnabled, setShannonEnabled] = useState(true);
    const [shannonHealthy, setShannonHealthy] = useState<boolean | null>(null);
    const [shannonChecking, setShannonChecking] = useState(false);

    // Shannon health check
    const checkShannonHealth = async () => {
        setShannonChecking(true);
        try {
            const res = await fetch("/api/css/shannon/health");
            const data = await res.json();
            setShannonHealthy(data.healthy);
            setShannonEnabled(data.enabled);
        } catch {
            setShannonHealthy(false);
        } finally {
            setShannonChecking(false);
        }
    };

    useEffect(() => {
        checkShannonHealth();
    }, []);

    // Save handler (placeholder — wire to backend settings API)
    const [saveStatus, setSaveStatus] = useState<string | null>(null);
    const handleSaveCSS = async () => {
        setSaveStatus("saving");
        try {
            // In production: POST to /api/settings/css with all CSS/AHI/Shannon settings
            await new Promise((r) => setTimeout(r, 800)); // Simulate save
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus(null), 2000);
        } catch {
            setSaveStatus("error");
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <header className="border-b border-gh-border pb-6">
                <h1 className="text-2xl font-black text-gh-text tracking-tight mb-2">
                    Code security
                </h1>
                <p className="text-sm text-gh-text-secondary leading-relaxed">
                    Security and analysis features help keep your repositories secure and updated. By
                    enabling these features, you're granting us permission to perform read-only analysis
                    on your repositories.
                </p>
            </header>

            {/* =============================================
                CSS & AHI Section (NEW)
            ============================================= */}
            <section className="bg-gh-bg-secondary border border-gh-border rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gh-border bg-gradient-to-r from-emerald-500/5 to-cyan-500/5">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="material-symbols-rounded text-emerald-400 text-xl">shield</span>
                        <h2 className="text-lg font-bold text-gh-text">CSS & AHI</h2>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 rounded-full uppercase tracking-wider">
                            TrackCodex
                        </span>
                    </div>
                    <p className="text-sm text-gh-text-secondary">
                        Code Security System with AI Hypothesis Intelligence — deep static analysis,
                        exploit-aware validation, and automated governance enforcement.
                    </p>
                </div>

                {/* CSS Core Toggle */}
                <div className="p-6 border-b border-gh-border">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-base font-bold text-gh-text">
                                    Code Security System (CSS)
                                </h3>
                                {cssEnabled && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                        Active
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gh-text-secondary">
                                Perform deep static analysis on all repository code — detects SQL injection,
                                XSS, command injection, path traversal, SSRF, auth bypass, hardcoded secrets,
                                and more using source-sink data flow analysis.
                            </p>
                        </div>
                        <button
                            onClick={() => setCssEnabled(!cssEnabled)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${cssEnabled
                                    ? "bg-transparent border-gh-border text-gh-text-secondary hover:text-white hover:border-red-500/50 hover:bg-red-500/10"
                                    : "bg-gh-bg border-gh-border text-gh-text hover:bg-gh-bg-tertiary"
                                }`}
                            title={cssEnabled ? "Disable CSS" : "Enable CSS"}
                        >
                            {cssEnabled ? "Disable" : "Enable"}
                        </button>
                    </div>

                    {cssEnabled && (
                        <div className="space-y-3 pl-0 mt-4 pt-4 border-t border-gh-border/50">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={cssAutoScan}
                                    onChange={(e) => setCssAutoScan(e.target.checked)}
                                    className="w-4 h-4 rounded border-gh-border bg-gh-bg accent-emerald-500"
                                />
                                <div>
                                    <span className="text-sm text-gh-text font-medium">
                                        Auto-scan on push
                                    </span>
                                    <p className="text-xs text-gh-text-secondary">
                                        Automatically trigger CSS scan when code is pushed to any branch
                                    </p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={cssMergeGate}
                                    onChange={(e) => setCssMergeGate(e.target.checked)}
                                    className="w-4 h-4 rounded border-gh-border bg-gh-bg accent-emerald-500"
                                />
                                <div>
                                    <span className="text-sm text-gh-text font-medium">
                                        Merge gate enforcement
                                    </span>
                                    <p className="text-xs text-gh-text-secondary">
                                        Block merges when critical vulnerabilities are confirmed or secure coding score drops below threshold
                                    </p>
                                </div>
                            </label>

                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-2">
                                    <label htmlFor="css-threshold" className="text-xs text-gh-text-secondary whitespace-nowrap">
                                        Secure coding threshold:
                                    </label>
                                    <input
                                        id="css-threshold"
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={cssScoreThreshold}
                                        onChange={(e) => setCssScoreThreshold(Number(e.target.value))}
                                        className="w-16 px-2 py-1 text-xs bg-gh-bg border border-gh-border rounded text-gh-text text-center"
                                        placeholder="70"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label htmlFor="css-parallel" className="text-xs text-gh-text-secondary whitespace-nowrap">
                                        Max parallel scans:
                                    </label>
                                    <input
                                        id="css-parallel"
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={cssMaxParallelScans}
                                        onChange={(e) => setCssMaxParallelScans(Number(e.target.value))}
                                        className="w-16 px-2 py-1 text-xs bg-gh-bg border border-gh-border rounded text-gh-text text-center"
                                        placeholder="5"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* AHI Toggle */}
                <div className="p-6 border-b border-gh-border">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-base font-bold text-gh-text">
                                    AI Hypothesis Intelligence (AHI)
                                </h3>
                                {ahiEnabled && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-violet-500/15 text-violet-400 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
                                        Active
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gh-text-secondary">
                                Uses AI to validate whether detected vulnerabilities are actually exploitable.
                                Assigns severity, provides technical reasoning, and generates secure patches.
                            </p>
                        </div>
                        <button
                            onClick={() => setAhiEnabled(!ahiEnabled)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${ahiEnabled
                                    ? "bg-transparent border-gh-border text-gh-text-secondary hover:text-white hover:border-red-500/50 hover:bg-red-500/10"
                                    : "bg-gh-bg border-gh-border text-gh-text hover:bg-gh-bg-tertiary"
                                }`}
                            title={ahiEnabled ? "Disable AHI" : "Enable AHI"}
                        >
                            {ahiEnabled ? "Disable" : "Enable"}
                        </button>
                    </div>

                    {ahiEnabled && (
                        <div className="space-y-3 pl-0 mt-4 pt-4 border-t border-gh-border/50">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={ahiAutoValidate}
                                    onChange={(e) => setAhiAutoValidate(e.target.checked)}
                                    className="w-4 h-4 rounded border-gh-border bg-gh-bg accent-violet-500"
                                />
                                <div>
                                    <span className="text-sm text-gh-text font-medium">
                                        Auto-validate all findings
                                    </span>
                                    <p className="text-xs text-gh-text-secondary">
                                        Automatically send all CSS hypotheses to AHI for exploit validation
                                    </p>
                                </div>
                            </label>

                            <div className="flex items-center gap-2 mt-2">
                                <label htmlFor="ahi-confidence" className="text-xs text-gh-text-secondary whitespace-nowrap">
                                    Minimum confidence to report:
                                </label>
                                <input
                                    id="ahi-confidence"
                                    type="number"
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    value={ahiMinConfidence}
                                    onChange={(e) => setAhiMinConfidence(Number(e.target.value))}
                                    className="w-16 px-2 py-1 text-xs bg-gh-bg border border-gh-border rounded text-gh-text text-center"
                                    placeholder="0.5"
                                />
                                <span className="text-[10px] text-gh-text-secondary">
                                    (0.0 = report everything, 1.0 = only high confidence)
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Shannon Adapter Toggle */}
                <div className="p-6 border-b border-gh-border">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-base font-bold text-gh-text">
                                    Shannon Exploit Validator
                                </h3>
                                {shannonEnabled && shannonHealthy === true && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-cyan-500/15 text-cyan-400 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                                        Connected
                                    </span>
                                )}
                                {shannonEnabled && shannonHealthy === false && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-400 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                                        Unreachable
                                    </span>
                                )}
                                {!shannonEnabled && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-gh-bg-tertiary text-gh-text-secondary rounded-full">
                                        Disabled
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gh-text-secondary">
                                Run parallel exploit validation for web routes, auth bypass, and injection risks.
                                Shannon operates as an isolated microservice and CSS continues working without it.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={checkShannonHealth}
                                disabled={shannonChecking}
                                className="px-3 py-2 rounded-lg text-xs font-bold border border-gh-border text-gh-text-secondary hover:bg-gh-bg-tertiary transition-all disabled:opacity-50"
                                title="Check Shannon health"
                            >
                                {shannonChecking ? (
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-rounded text-sm animate-spin">sync</span>
                                        Checking
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-rounded text-sm">monitor_heart</span>
                                        Health
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setShannonEnabled(!shannonEnabled)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${shannonEnabled
                                        ? "bg-transparent border-gh-border text-gh-text-secondary hover:text-white hover:border-red-500/50 hover:bg-red-500/10"
                                        : "bg-gh-bg border-gh-border text-gh-text hover:bg-gh-bg-tertiary"
                                    }`}
                                title={shannonEnabled ? "Disable Shannon" : "Enable Shannon"}
                            >
                                {shannonEnabled ? "Disable" : "Enable"}
                            </button>
                        </div>
                    </div>

                    {shannonEnabled && (
                        <div className="mt-4 pt-4 border-t border-gh-border/50">
                            <div className="flex items-center gap-4 text-xs text-gh-text-secondary">
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-rounded text-sm">dns</span>
                                    <span>Endpoint: <code className="text-gh-text bg-gh-bg px-1 rounded text-[10px]">localhost:4100</code></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-rounded text-sm">category</span>
                                    <span>Categories: WEB_ROUTE, AUTH_BYPASS, INJECTION</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <div className="p-6 bg-gh-bg/50 flex items-center justify-between">
                    <p className="text-xs text-gh-text-secondary">
                        Changes apply to all repositories you own.
                    </p>
                    <button
                        onClick={handleSaveCSS}
                        disabled={saveStatus === "saving"}
                        className={`px-5 py-2 rounded-lg text-xs font-bold border transition-all ${saveStatus === "saved"
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                : saveStatus === "error"
                                    ? "bg-red-500/15 border-red-500/30 text-red-400"
                                    : "bg-primary border-transparent text-white hover:bg-primary/90 disabled:opacity-50"
                            }`}
                        title="Save CSS & AHI settings"
                    >
                        {saveStatus === "saving"
                            ? "Saving..."
                            : saveStatus === "saved"
                                ? "✓ Saved"
                                : saveStatus === "error"
                                    ? "Error — Retry"
                                    : "Save changes"}
                    </button>
                </div>
            </section>

            {/* =============================================
                User Section (existing)
            ============================================= */}
            <section className="bg-gh-bg-secondary border border-gh-border rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gh-border">
                    <h2 className="text-lg font-bold text-gh-text mb-1">User</h2>
                    <p className="text-sm text-gh-text-secondary">
                        Security and analysis features help keep you secure and updated, wherever you are.
                    </p>
                </div>

                {/* Push protection for yourself */}
                <div className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-gh-text mb-2">
                                Push protection for yourself
                            </h3>
                            <p className="text-sm text-gh-text-secondary mb-2">
                                Block commits that contain{" "}
                                <a href="#" className="text-primary hover:underline">
                                    supported secrets
                                </a>{" "}
                                across all public repositories on TrackCodex.
                            </p>
                        </div>
                        <button
                            onClick={() => setPushProtection(!pushProtection)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${pushProtection
                                ? "bg-transparent border-gh-border text-gh-text-secondary hover:text-white hover:border-red-500/50 hover:bg-red-500/10"
                                : "bg-gh-bg border-gh-border text-gh-text hover:bg-gh-bg-tertiary"
                                }`}
                            title={pushProtection ? "Disable push protection" : "Enable push protection"}
                        >
                            {pushProtection ? "Disable" : "Enable"}
                        </button>
                    </div>
                </div>
            </section>

            {/* Repositories Section */}
            <section className="bg-gh-bg-secondary border border-gh-border rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gh-border">
                    <h2 className="text-lg font-bold text-gh-text mb-1">Repositories</h2>
                    <p className="text-sm text-gh-text-secondary">
                        Security and analysis features help keep your repositories secure and updated.
                    </p>
                </div>

                {/* Private vulnerability reporting */}
                <div className="p-6 border-b border-gh-border">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-gh-text mb-2">
                                Private vulnerability reporting
                            </h3>
                            <p className="text-sm text-gh-text-secondary mb-2">
                                Allow your community to privately report potential security vulnerabilities to
                                maintainers and repository owners.{" "}
                                <a href="#" className="text-primary hover:underline">
                                    Learn more about private vulnerability reporting.
                                </a>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() =>
                                    setPrivateVulnerability({ ...privateVulnerability, enabled: false })
                                }
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${!privateVulnerability.enabled
                                    ? "bg-transparent border-red-500/50 text-red-400"
                                    : "bg-gh-bg border-gh-border text-gh-text hover:bg-gh-bg-tertiary"
                                    }`}
                                title="Disable private vulnerability reporting"
                            >
                                Disable all
                            </button>
                            <button
                                onClick={() =>
                                    setPrivateVulnerability({ ...privateVulnerability, enabled: true })
                                }
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${privateVulnerability.enabled
                                    ? "bg-primary border-transparent text-white"
                                    : "bg-gh-bg border-gh-border text-gh-text hover:bg-gh-bg-tertiary"
                                    }`}
                                title="Enable private vulnerability reporting"
                            >
                                Enable all
                            </button>
                        </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={privateVulnerability.autoEnable}
                            onChange={(e) =>
                                setPrivateVulnerability({
                                    ...privateVulnerability,
                                    autoEnable: e.target.checked,
                                })
                            }
                            className="w-4 h-4 rounded border-gh-border bg-gh-bg"
                        />
                        <span className="text-sm text-gh-text">
                            Automatically enable for new public repositories
                        </span>
                    </label>
                </div>

                {/* Dependency graph */}
                <div className="p-6 border-b border-gh-border">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-gh-text mb-2">Dependency graph</h3>
                            <p className="text-sm text-gh-text-secondary mb-2">
                                Understand your dependencies.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDependencyGraph({ ...dependencyGraph, enabled: false })}
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${!dependencyGraph.enabled
                                    ? "bg-transparent border-red-500/50 text-red-400"
                                    : "bg-gh-bg border-gh-border text-gh-text hover:bg-gh-bg-tertiary"
                                    }`}
                                title="Disable dependency graph"
                            >
                                Disable all
                            </button>
                            <button
                                onClick={() => setDependencyGraph({ ...dependencyGraph, enabled: true })}
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${dependencyGraph.enabled
                                    ? "bg-primary border-transparent text-white"
                                    : "bg-gh-bg border-gh-border text-gh-text hover:bg-gh-bg-tertiary"
                                    }`}
                                title="Enable dependency graph"
                            >
                                Enable all
                            </button>
                        </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={dependencyGraph.autoEnable}
                            onChange={(e) =>
                                setDependencyGraph({
                                    ...dependencyGraph,
                                    autoEnable: e.target.checked,
                                })
                            }
                            className="w-4 h-4 rounded border-gh-border bg-gh-bg"
                        />
                        <span className="text-sm text-gh-text">
                            Automatically enable for new repositories
                        </span>
                    </label>
                </div>

                {/* Dependabot Section */}
                <div className="p-6 border-b border-gh-border bg-gh-bg/50">
                    <h3 className="text-base font-bold text-gh-text mb-2">Dependabot</h3>
                    <p className="text-sm text-gh-text-secondary">
                        Keep your dependencies secure and up-to-date.{" "}
                        <a href="#" className="text-primary hover:underline">
                            Learn more about Dependabot.
                        </a>
                    </p>
                </div>

                {/* Dependabot alerts */}
                <div className="p-6 border-b border-gh-border">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-gh-text mb-2">Dependabot alerts</h3>
                            <p className="text-sm text-gh-text-secondary mb-2">
                                Receive alerts for vulnerabilities that affect your dependencies and manually
                                generate Dependabot pull requests to resolve these vulnerabilities.{" "}
                                <a href="#" className="text-primary hover:underline">
                                    Configure alert notifications.
                                </a>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDependabotAlerts({ ...dependabotAlerts, enabled: false })}
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${!dependabotAlerts.enabled
                                    ? "bg-transparent border-red-500/50 text-red-400"
                                    : "bg-gh-bg border-gh-border text-gh-text hover:bg-gh-bg-tertiary"
                                    }`}
                                title="Disable Dependabot alerts"
                            >
                                Disable all
                            </button>
                            <button
                                onClick={() => setDependabotAlerts({ ...dependabotAlerts, enabled: true })}
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${dependabotAlerts.enabled
                                    ? "bg-primary border-transparent text-white"
                                    : "bg-gh-bg border-gh-border text-gh-text hover:bg-gh-bg-tertiary"
                                    }`}
                                title="Enable Dependabot alerts"
                            >
                                Enable all
                            </button>
                        </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={dependabotAlerts.autoEnable}
                            onChange={(e) =>
                                setDependabotAlerts({
                                    ...dependabotAlerts,
                                    autoEnable: e.target.checked,
                                })
                            }
                            className="w-4 h-4 rounded border-gh-border bg-gh-bg"
                        />
                        <span className="text-sm text-gh-text">
                            Automatically enable for new repositories
                        </span>
                    </label>
                </div>

                {/* Dependabot security updates */}
                <div className="p-6 border-b border-gh-border">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-gh-text mb-2">
                                Dependabot security updates
                            </h3>
                            <p className="text-sm text-gh-text-secondary mb-2">
                                Enabling this option will result in Dependabot automatically attempting to open
                                pull requests to resolve every Dependabot alert with an available patch.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() =>
                                    setDependabotSecurityUpdates({ ...dependabotSecurityUpdates, enabled: false })
                                }
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${!dependabotSecurityUpdates.enabled
                                    ? "bg-transparent border-red-500/50 text-red-400"
                                    : "bg-gh-bg border-gh-border text-gh-text hover:bg-gh-bg-tertiary"
                                    }`}
                                title="Disable Dependabot security updates"
                            >
                                Disable all
                            </button>
                            <button
                                onClick={() =>
                                    setDependabotSecurityUpdates({ ...dependabotSecurityUpdates, enabled: true })
                                }
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${dependabotSecurityUpdates.enabled
                                    ? "bg-primary border-transparent text-white"
                                    : "bg-gh-bg border-gh-border text-gh-text hover:bg-gh-bg-tertiary"
                                    }`}
                                title="Enable Dependabot security updates"
                            >
                                Enable all
                            </button>
                        </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={dependabotSecurityUpdates.autoEnable}
                            onChange={(e) =>
                                setDependabotSecurityUpdates({
                                    ...dependabotSecurityUpdates,
                                    autoEnable: e.target.checked,
                                })
                            }
                            className="w-4 h-4 rounded border-gh-border bg-gh-bg"
                        />
                        <span className="text-sm text-gh-text">
                            Automatically enable for new repositories
                        </span>
                    </label>
                </div>

                {/* Grouped security updates */}
                <div className="p-6 border-b border-gh-border">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-gh-text mb-2">
                                Grouped security updates
                            </h3>
                            <p className="text-sm text-gh-text-secondary mb-2">
                                Groups all available updates that resolve a Dependabot alert into one pull
                                request (per package manager and directory of requirements manifest). This option
                                may be overridden by group rules specified in dependabot.yml —{" "}
                                <a href="#" className="text-primary hover:underline">
                                    Learn how to group updates.
                                </a>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() =>
                                    setGroupedSecurityUpdates({ ...groupedSecurityUpdates, enabled: false })
                                }
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${!groupedSecurityUpdates.enabled
                                    ? "bg-transparent border-red-500/50 text-red-400"
                                    : "bg-gh-bg border-gh-border text-gh-text hover:bg-gh-bg-tertiary"
                                    }`}
                                title="Disable grouped security updates"
                            >
                                Disable all
                            </button>
                            <button
                                onClick={() =>
                                    setGroupedSecurityUpdates({ ...groupedSecurityUpdates, enabled: true })
                                }
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${groupedSecurityUpdates.enabled
                                    ? "bg-primary border-transparent text-white"
                                    : "bg-gh-bg border-gh-border text-gh-text hover:bg-gh-bg-tertiary"
                                    }`}
                                title="Enable grouped security updates"
                            >
                                Enable all
                            </button>
                        </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={groupedSecurityUpdates.autoEnable}
                            onChange={(e) =>
                                setGroupedSecurityUpdates({
                                    ...groupedSecurityUpdates,
                                    autoEnable: e.target.checked,
                                })
                            }
                            className="w-4 h-4 rounded border-gh-border bg-gh-bg"
                        />
                        <span className="text-sm text-gh-text">
                            Automatically enable for new repositories
                        </span>
                    </label>
                </div>

                {/* Dependabot on self-hosted runners */}
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-gh-text mb-2">
                                Dependabot on self-hosted runners
                            </h3>
                            <p className="text-sm text-gh-text-secondary mb-2">
                                Run Dependabot security and version updates on self-hosted Actions runners.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() =>
                                    setDependabotSelfHosted({ ...dependabotSelfHosted, enabled: false })
                                }
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${!dependabotSelfHosted.enabled
                                    ? "bg-transparent border-red-500/50 text-red-400"
                                    : "bg-gh-bg border-gh-border text-gh-text hover:bg-gh-bg-tertiary"
                                    }`}
                                title="Disable Dependabot on self-hosted runners"
                            >
                                Disable all
                            </button>
                            <button
                                onClick={() =>
                                    setDependabotSelfHosted({ ...dependabotSelfHosted, enabled: true })
                                }
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${dependabotSelfHosted.enabled
                                    ? "bg-primary border-transparent text-white"
                                    : "bg-gh-bg border-gh-border text-gh-text hover:bg-gh-bg-tertiary"
                                    }`}
                                title="Enable Dependabot on self-hosted runners"
                            >
                                Enable all
                            </button>
                        </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={dependabotSelfHosted.autoEnable}
                            onChange={(e) =>
                                setDependabotSelfHosted({
                                    ...dependabotSelfHosted,
                                    autoEnable: e.target.checked,
                                })
                            }
                            className="w-4 h-4 rounded border-gh-border bg-gh-bg"
                        />
                        <span className="text-sm text-gh-text">
                            Automatically enable for new repositories
                        </span>
                    </label>
                </div>
            </section>
        </div>
    );
};

export default AhiCsSettings;
