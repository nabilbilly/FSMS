import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import {
  Building2,
  Users,
  Send,
  Mail,
  Plus,
  X,
  Save,
  Activity,
  ArrowUpRight,
  Zap,
  Hash,
  Globe,
  Menu,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Pencil,
  Trash2,
  Settings as SettingsIcon,
} from "lucide-react";

// ── Types ──
interface GlobalStats {
  total_companies: number;
  total_branches: number;
  total_sms: number;
  total_emails: number;
  total_customers: number;
}
interface Company {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  hubtel_client_id: string;
  hubtel_client_secret: string;
  brevo_api_key: string;
  brevo_sender_email: string;
  brevo_sender_name: string;
}
interface Branch {
  id: number;
  name: string;
  branch_code: string;
  company_id: number;
}

// ── Main Component ──
const MasterAdmin: React.FC = () => {
  const BASE = `${API_BASE_URL}/admin`;
  const [view, setView] = useState<"overview" | "companies" | "manage-companies" | "sms" | "email" | "settings">("overview");
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "company" | "branch" | "delete-company">(null);
  const [targetCompany, setTargetCompany] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  // Selection states
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  
  // Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Desktop: expanded/collapsed
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile: open/closed overlay

  const [cf, setCf] = useState({
    name: "",
    slug: "",
    hubtel_client_id: "",
    hubtel_client_secret: "",
    brevo_api_key: "",
    brevo_sender_email: "",
    brevo_sender_name: "",
  });
  const [bf, setBf] = useState({ name: "", branch_code: "", pin: "" });


  useEffect(() => {
    load();
    // Close mobile menu on view change
    setIsMobileMenuOpen(false);
  }, [view]);

  useEffect(() => {
    if (selectedCompanyId) {
      const company = companies.find(c => c.id === selectedCompanyId);
      if (company) {
        fetchBranches(company.slug);
      }
    } else {
      setBranches([]);
    }
  }, [selectedCompanyId, companies]);

  const fetchBranches = async (slug: string) => {
    setLoadingBranches(true);
    try {
      const r = await fetch(`${BASE}/public/companies/${slug}/branches`);
      if (r.ok) {
        setBranches(await r.json());
      }
    } catch (e) {
      console.error("Error fetching branches:", e);
    } finally {
      setLoadingBranches(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      if (view === "overview") {
        const r = await fetch(`${BASE}/stats`);
        setStats(await r.json());
      } else if (view === "companies") {
        const r = await fetch(`${BASE}/companies`);
        const data = await r.json();
        setCompanies(Array.isArray(data) ? data : []);
      } else if (view === "manage-companies" || view === "settings") {
        const r = await fetch(`${BASE}/companies`);
        const data = await r.json();
        setCompanies(Array.isArray(data) ? data : []);
      } else if (view === "sms") {
        const r = await fetch(`${BASE}/logs/sms`);
        setLogs((await r.json()).items || []);
      } else {
        const r = await fetch(`${BASE}/logs/email`);
        setLogs((await r.json()).items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatError = (detail: any): string => {
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map(err => {
        const loc = Array.isArray(err.loc) ? err.loc.join('.') : 'error';
        return `${loc}: ${err.msg}`;
      }).join(', ');
    }
    if (typeof detail === 'object' && detail !== null) {
      return JSON.stringify(detail);
    }
    return "An unexpected error occurred";
  };

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const submitCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const isUpdate = !!targetCompany && modal === "company";
    const url = isUpdate ? `${BASE}/companies/${targetCompany}` : `${BASE}/companies`;
    const method = isUpdate ? "PUT" : "POST";

    const r = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cf),
    });
    if (r.ok) {
      setModal(null);
      setCf({
        name: "",
        slug: "",
        hubtel_client_id: "",
        hubtel_client_secret: "",
        brevo_api_key: "",
        brevo_sender_email: "",
        brevo_sender_name: "",
      });
      flash(isUpdate ? "Company updated successfully" : "Company created successfully");
      load();
    } else {
      const d = await r.json();
      flash(formatError(d.detail));
    }
  };

  const submitBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCompany) return;
    const r = await fetch(`${BASE}/companies/${targetCompany}/branches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bf),
    });
    if (r.ok) {
      setModal(null);
      setBf({ name: "", branch_code: "", pin: "" });
      flash("Branch created successfully");
      
      // Refresh branches if the selected company is the one we just added a branch to
      if (selectedCompanyId === targetCompany) {
        const company = companies.find(c => c.id === targetCompany);
        if (company) fetchBranches(company.slug);
      }
    } else {
      const d = await r.json();
      flash(formatError(d.detail));
    }
  };

  const deleteCompany = async () => {
    if (!targetCompany) return;
    const r = await fetch(`${BASE}/companies/${targetCompany}`, { method: "DELETE" });
    if (r.ok) {
      setModal(null);
      setSelectedCompanyId(null);
      flash("Company and all associated data cleared");
      load();
    } else {
      const d = await r.json();
      flash(formatError(d.detail));
    }
  };

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: <Activity size={18} /> },
    { id: "companies" as const, label: "Companies", icon: <Building2 size={18} /> },
    { id: "manage-companies" as const, label: "Manage Companies", icon: <Users size={18} /> },
    { id: "sms" as const, label: "SMS Activity", icon: <Send size={18} /> },
    { id: "email" as const, label: "Email Activity", icon: <Mail size={18} /> },
    { id: "settings" as const, label: "Settings", icon: <SettingsIcon size={18} /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#050508] text-gray-200 overflow-x-hidden relative">
      
      {/* ── Mobile Sidebar Overlay ── */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-[60] bg-[#0a0a0f] border-r border-white/5 flex flex-col transition-all duration-300
          ${isSidebarOpen ? "w-64" : "w-20"}
          ${isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Zap size={18} className="text-white" />
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <span className="text-lg font-bold tracking-tight text-white animate-in fade-in duration-300">
                Nexus<span className="text-indigo-500">Admin</span>
              </span>
            )}
          </div>
          
          {/* Desktop Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-md hover:bg-white/5 text-gray-500 hover:text-white transition-colors lg:flex hidden"
          >
            {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
          
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-md hover:bg-white/5 text-gray-500 hover:text-white transition-colors lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-0 space-y-1 mt-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 transition-all duration-200 group ${
                view === t.id
                  ? "bg-indigo-600/10 text-indigo-400 border-r-2 border-indigo-500"
                  : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
              }`}
            >
              <div className={`${view === t.id ? "text-indigo-400" : "text-gray-500 group-hover:text-gray-300"}`}>
                {t.icon}
              </div>
              {(isSidebarOpen || isMobileMenuOpen) && (
                <span className="text-sm font-medium animate-in fade-in duration-300">{t.label}</span>
              )}
              {view === t.id && (isSidebarOpen || isMobileMenuOpen) && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-glow" />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto w-full">
          <div
            className={`flex items-center gap-3 p-6 bg-white/5 border-t border-white/5 w-full ${
              (!isSidebarOpen && !isMobileMenuOpen) && "justify-center"
            }`}
          >
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <div className="flex flex-col animate-in fade-in duration-300">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Systems</span>
                <span className="text-xs text-emerald-400 font-medium">Operational</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main
        className={`flex-1 transition-all duration-300 w-full min-h-screen !max-w-none ${
          isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        {/* Mobile Header */}
        <div className="lg:hidden h-16 bg-[#0a0a0f] border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">Nexus<span className="text-indigo-500">Admin</span></span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-white/5 text-gray-400"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="w-full p-6 md:p-10 !max-w-none">
          {/* Desktop Header Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight capitalize">
                {view.replace("-", " ")}
              </h1>
              <p className="text-gray-500 mt-1 text-sm font-medium">
                {view === "overview" && "Global metrics and performance overview"}
                {view === "companies" && "Overview of all registered companies"}
                {view === "manage-companies" && "Manage company branches and infrastructure"}
                {view === "settings" && "Advanced system configurations and data management"}
                {(view === "sms" || view === "email") && "System-wide activity monitoring"}
              </p>
            </div>
            
            {view === "settings" && (
              <button
                onClick={() => {
                  setTargetCompany(null);
                  setCf({
                    name: "",
                    slug: "",
                    hubtel_client_id: "",
                    hubtel_client_secret: "",
                    brevo_api_key: "",
                    brevo_sender_email: "",
                    brevo_sender_name: "",
                  });
                  setModal("company");
                }}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                <Plus size={18} />
                <span>Add Company</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 size={40} className="text-indigo-500 animate-spin" />
              <span className="text-gray-500 text-sm font-medium">Synchronizing data...</span>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Overview View */}
              {view === "overview" && stats && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard label="Companies" val={stats.total_companies} icon={<Building2 size={20} />} color="blue" />
                    <StatCard label="Branches" val={stats.total_branches} icon={<Hash size={20} />} color="purple" />
                    <StatCard label="SMS Sent" val={stats.total_sms} icon={<Send size={20} />} color="cyan" />
                    <StatCard label="Emails" val={stats.total_emails} icon={<Mail size={20} />} color="pink" />
                    <StatCard label="Customers" val={stats.total_customers} icon={<Users size={20} />} color="emerald" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <QuickActionCard
                      title="Manage Tenants"
                      desc="Configure company details, API gateways, and manage branch infrastructure."
                      onClick={() => setView("companies")}
                      icon={<Building2 size={24} />}
                      hoverColor="indigo"
                    />
                    <QuickActionCard
                      title="Monitor Logs"
                      desc="View real-time delivery reports and message traffic across the entire platform."
                      onClick={() => setView("sms")}
                      icon={<Activity size={24} />}
                      hoverColor="emerald"
                    />
                  </div>
                </div>
              )}

              {/* Companies View (Card Grid) */}
              {view === "companies" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {companies.map((c) => (
                    <div key={c.id} className="bg-[#0a0a0f] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.02] transition-all group">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 font-bold text-lg">
                          {(c.name || "C").charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-white font-bold">{c.name || "Unnamed"}</h3>
                          <span className="text-gray-500 text-xs font-mono">/{c.slug}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${c.is_active ? 'text-emerald-500' : 'text-gray-500'}`}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button 
                          onClick={() => {
                            setSelectedCompanyId(c.id);
                            setView("manage-companies");
                          }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                        >
                          Manage Branches <ArrowUpRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Manage Companies View (Dropdown + Branches) */}
              {view === "manage-companies" && (
                <div className="space-y-8">
                  {/* Company Dropdown Selection */}
                  <div className="bg-[#0a0a0f] border border-white/5 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                        Select Company
                      </label>
                      <div className="relative">
                        <select
                          value={selectedCompanyId || ""}
                          onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
                          className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all appearance-none cursor-pointer"
                        >
                          <option value="" disabled className="bg-[#0a0a0f]">Choose a company...</option>
                          {companies.map((c) => (
                            <option key={c.id} value={c.id} className="bg-[#0a0a0f]">
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                          <ChevronLeft size={18} className="-rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Company Details & Branches */}
                  {selectedCompanyId ? (
                    (() => {
                      const c = companies.find(comp => comp.id === selectedCompanyId);
                      if (!c) return null;
                      return (
                        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                          {/* Company Main Info */}
                          <div className="bg-[#0a0a0f] border border-white/5 rounded-2xl p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600/20 to-indigo-900/40 flex items-center justify-center text-indigo-400 font-bold text-lg border border-indigo-500/20 shadow-inner">
                                  {(c.name || "C").charAt(0)}
                                </div>
                                <div>
                                  <h3 className="text-white font-semibold text-lg">{c.name || "Unnamed"}</h3>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-gray-500 text-xs font-mono">/{c.slug}</span>
                                    <div className="w-1 h-1 rounded-full bg-gray-700" />
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${c.is_active ? 'text-emerald-500' : 'text-gray-500'}`}>
                                      {c.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-3">
                                  <div className="flex gap-2 mr-4">
                                    <GatewayStatus label="Hubtel" active={!!c.hubtel_client_id} />
                                    <GatewayStatus label="Brevo" active={!!c.brevo_api_key} />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        setTargetCompany(c.id);
                                        setModal("branch");
                                      }}
                                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                                    >
                                      <Plus size={14} />
                                      <span>Register Branch</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
 
                            {/* Branches List Section */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between px-2">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                  <Hash size={16} className="text-indigo-500" />
                                  Registered Branches
                                </h4>
                                <span className="text-xs text-gray-500 font-medium">{branches.length} total</span>
                              </div>
 
                              {loadingBranches ? (
                                <div className="flex items-center gap-3 py-10 justify-center text-gray-500">
                                  <Loader2 size={20} className="animate-spin text-indigo-500" />
                                  <span className="text-sm font-medium">Loading branches...</span>
                                </div>
                              ) : branches.length === 0 ? (
                                <div className="bg-[#0a0a0f] border border-white/5 border-dashed rounded-2xl py-12 flex flex-col items-center justify-center text-gray-600">
                                  <AlertCircle size={24} className="mb-2 opacity-20" />
                                  <p className="text-sm font-medium">No branches found for this company</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {branches.map((b) => (
                                    <div
                                      key={b.id}
                                      className="bg-[#0a0a0f] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all group"
                                    >
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="p-2 rounded-lg bg-white/5 text-indigo-400 group-hover:bg-indigo-600/10 transition-colors">
                                          <Building2 size={18} />
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-600 group-hover:text-gray-400">ID: {b.id}</span>
                                      </div>
                                      <h5 className="text-white font-bold text-sm mb-1">{b.name}</h5>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 font-medium">Code:</span>
                                        <span className="text-xs text-indigo-400 font-mono font-bold bg-indigo-500/10 px-2 py-0.5 rounded">
                                          {b.branch_code}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="bg-[#0a0a0f] border border-white/5 border-dashed rounded-3xl py-32 flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 rounded-full bg-white/5 text-gray-700">
                          <Building2 size={40} />
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 font-semibold text-lg">Select a company to manage</p>
                          <p className="text-gray-600 text-sm mt-1">Choose a company from the dropdown above to view details and branches</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
 
                {/* Settings View (CRUD) */}
                {view === "settings" && (
                  <div className="space-y-8 max-w-4xl">
                    <div className="bg-[#0a0a0f] border border-white/5 rounded-2xl p-8 shadow-sm">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/10">
                          <SettingsIcon size={24} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white tracking-tight">Company Administration</h2>
                          <p className="text-gray-500 text-sm mt-0.5">Manage configurations and system-wide deletions</p>
                        </div>
                      </div>
 
                      <div className="grid grid-cols-1 gap-4">
                        {companies.map((c) => (
                          <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all group">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 font-bold group-hover:bg-indigo-600/10 group-hover:text-indigo-400 transition-colors">
                                {(c.name || "C").charAt(0)}
                              </div>
                              <div>
                                <h3 className="text-white font-semibold text-sm">{c.name || "Unnamed"}</h3>
                                <p className="text-gray-500 text-[10px] font-mono mt-0.5 tracking-wider">ID: {c.id} • SLUG: /{c.slug}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-4 sm:mt-0">
                              <button
                                onClick={() => {
                                  setTargetCompany(c.id);
                                  setCf({
                                    name: c.name,
                                    slug: c.slug,
                                    hubtel_client_id: c.hubtel_client_id || "",
                                    hubtel_client_secret: c.hubtel_client_secret || "",
                                    brevo_api_key: c.brevo_api_key || "",
                                    brevo_sender_email: c.brevo_sender_email || "",
                                    brevo_sender_name: c.brevo_sender_name || "",
                                  });
                                  setModal("company");
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all text-[11px] font-bold uppercase tracking-wider"
                              >
                                <Pencil size={12} />
                                <span>Edit Details</span>
                              </button>
                              <button
                                onClick={() => {
                                  setTargetCompany(c.id);
                                  setModal("delete-company");
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white border border-red-500/20 transition-all text-[11px] font-bold uppercase tracking-wider"
                              >
                                <Trash2 size={12} />
                                <span>Clear Data</span>
                              </button>
                            </div>
                          </div>
                        ))}
 
                        {companies.length === 0 && (
                          <div className="py-20 text-center text-gray-600 italic border border-white/5 border-dashed rounded-2xl">
                            No companies found to manage
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Logs View (SMS/Email) */}
              {(view === "sms" || view === "email") && (
                <div className="bg-[#0a0a0f] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          {["Company", "Branch", view === "sms" ? "Recipient" : "Subject", "Status", "Timestamp"].map((h) => (
                            <th key={h} className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {logs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-20 text-center text-gray-600 italic">
                              No activity logs recorded yet
                            </td>
                          </tr>
                        ) : (
                          logs.map((l) => (
                            <tr key={l.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-white font-medium text-sm group-hover:text-indigo-400 transition-colors">{l.company_name}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-gray-400 text-sm">{l.branch_name}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-gray-300 text-sm line-clamp-1 max-w-[200px]">
                                  {view === "sms" ? l.phone_number : l.subject}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <StatusBadge status={l.status} />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-xs font-medium">
                                {new Date(l.scheduled_for || l.created_at).toLocaleString([], {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Modals ── */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setModal(null)} />
          
          <div className="relative bg-[#0d0d12] border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {modal === "company" ? (targetCompany ? "Update Company" : "New Company") : 
                   modal === "branch" ? "Register Branch" : 
                   "Clear Company Data"}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {modal === "delete-company" ? "This action is irreversible" : "Fill in the required information below"}
                </p>
              </div>
              <button onClick={() => setModal(null)} className="p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
 
            <div className="p-8 overflow-y-auto custom-scrollbar">
              {modal === "delete-company" ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-4">
                    <AlertCircle className="text-red-500 shrink-0" size={24} />
                    <div className="space-y-2">
                      <h3 className="text-red-500 font-bold">Critical Warning</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        All details and information of this company will be totally cleared from the database. 
                        Every record, branch, and info will be removed. 
                        <strong> Are you sure?</strong>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      onClick={() => setModal(null)}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                      No, Keep Data
                    </button>
                    <button
                      onClick={deleteCompany}
                      className="bg-red-600 hover:bg-red-500 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-600/20 active:scale-95"
                    >
                      Yes, Clear Everything
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={modal === "company" ? submitCompany : submitBranch} className="space-y-8">
                  {modal === "company" ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label="Company Name" placeholder="Classhouse Electronics" value={cf.name} onChange={v => setCf({ ...cf, name: v })} />
                        <InputField label="Unique Slug" placeholder="classhouse" value={cf.slug} onChange={v => setCf({ ...cf, slug: v })} />
                      </div>
 
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
                          <Globe size={14} />
                          <span>SMS Gateway (Hubtel)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <InputField label="Client ID" value={cf.hubtel_client_id} onChange={v => setCf({ ...cf, hubtel_client_id: v })} />
                          <InputField label="Client Secret" type="password" value={cf.hubtel_client_secret} onChange={v => setCf({ ...cf, hubtel_client_secret: v })} />
                        </div>
                      </div>
 
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase tracking-widest">
                          <Mail size={14} />
                          <span>Email Gateway (Brevo)</span>
                        </div>
                        <div className="space-y-4">
                          <InputField label="API Key" type="password" value={cf.brevo_api_key} onChange={v => setCf({ ...cf, brevo_api_key: v })} />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField label="Sender Email" value={cf.brevo_sender_email} onChange={v => setCf({ ...cf, brevo_sender_email: v })} />
                            <InputField label="Sender Name" value={cf.brevo_sender_name} onChange={v => setCf({ ...cf, brevo_sender_name: v })} />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <InputField label="Branch Name" placeholder="Accra Mall Branch" value={bf.name} onChange={v => setBf({ ...bf, name: v })} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label="Branch Code" placeholder="ACCRA01" value={bf.branch_code} onChange={v => setBf({ ...bf, branch_code: v })} />
                        <InputField label="Access PIN" type="password" placeholder="4-digit PIN" value={bf.pin} onChange={v => setBf({ ...bf, pin: v })} />
                      </div>
                    </div>
                  )}
 
                  <div className="pt-6 border-t border-white/5 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setModal(null)}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                      {modal === "company" ? (targetCompany ? "Save Changes" : "Register Company") : "Confirm Branch"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] animate-in slide-in-from-right-10 fade-in duration-300">
          <div className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl shadow-indigo-900/20 flex items-center gap-3 border border-indigo-400/30">
            <CheckCircle2 size={20} />
            <span className="text-sm font-bold tracking-wide">{toast}</span>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .shadow-glow {
          box-shadow: 0 0 10px rgba(129, 140, 248, 0.5);
        }
      `}</style>
    </div>
  );
};

// ── Sub-components ──

const StatCard = ({ label, val, icon, color }: { label: string; val: number; icon: any; color: string }) => {
  const themes: any = {
    blue: "from-blue-600/20 text-blue-400 border-blue-500/20",
    purple: "from-purple-600/20 text-purple-400 border-purple-500/20",
    cyan: "from-cyan-600/20 text-cyan-400 border-cyan-500/20",
    pink: "from-pink-600/20 text-pink-400 border-pink-500/20",
    emerald: "from-emerald-600/20 text-emerald-400 border-emerald-500/20",
  };

  return (
    <div className={`bg-[#0a0a0f] border rounded-2xl p-6 transition-all duration-300 hover:bg-gradient-to-br ${themes[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
        <div className="p-2 rounded-lg bg-white/5">{icon}</div>
      </div>
      <div className="text-3xl font-black text-white tracking-tight">{val.toLocaleString()}</div>
    </div>
  );
};

const QuickActionCard = ({ title, desc, onClick, icon, hoverColor }: { title: string; desc: string; onClick: () => void; icon: any; hoverColor: string }) => {
  const themes: any = {
    indigo: "hover:border-indigo-500/40 hover:bg-indigo-600/5 group-hover:text-indigo-400",
    emerald: "hover:border-emerald-500/40 hover:bg-emerald-600/5 group-hover:text-emerald-400",
  };

  return (
    <button
      onClick={onClick}
      className={`bg-[#0a0a0f] border border-white/5 rounded-2xl p-8 flex items-center justify-between group transition-all duration-300 text-left ${themes[hoverColor]}`}
    >
      <div className="flex items-center gap-6">
        <div className={`p-4 rounded-2xl bg-white/5 transition-colors ${themes[hoverColor]}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed max-w-sm">{desc}</p>
        </div>
      </div>
      <ArrowUpRight size={24} className="text-gray-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
    </button>
  );
};

const InputField = ({ label, type = "text", placeholder = "", value, onChange }: { label: string; type?: string; placeholder?: string; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-2 group">
    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 group-focus-within:text-indigo-400 transition-colors">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-700 outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all"
    />
  </div>
);

const GatewayStatus = ({ label, active }: { label: string; active: boolean }) => (
  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tighter ${
    active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
  }`}>
    <div className={`w-1 h-1 rounded-full ${active ? 'bg-emerald-400' : 'bg-red-400'}`} />
    {label}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const isSent = status === "sent";
  const isQueued = status === "queued";
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
      isSent ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
      isQueued ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
      "bg-red-500/10 text-red-500 border-red-500/20"
    }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isSent ? "bg-emerald-500" : isQueued ? "bg-blue-500" : "bg-red-500"}`} />
      {status}
    </div>
  );
};

const EmptyState = ({ label }: { label: string }) => (
  <div className="bg-[#0a0a0f] border border-white/5 border-dashed rounded-3xl py-20 flex flex-col items-center justify-center space-y-4">
    <div className="p-4 rounded-full bg-white/5 text-gray-600">
      <AlertCircle size={32} />
    </div>
    <span className="text-gray-500 font-medium">{label}</span>
  </div>
);

export default MasterAdmin;
