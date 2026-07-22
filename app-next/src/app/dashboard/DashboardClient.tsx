"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Building2,
  FileText,
  LogOut,
  Plus,
  Edit2,
  Copy,
  Search,
  Users,
  Check,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Clock,
  Briefcase,
  Filter,
  LayoutGrid,
  List,
  Eye
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CustomSelect } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { IUserDTO } from "@/types/user";
import { ICompanyDTO } from "@/types/company";
import { IOfferDTO, OfferStatus } from "@/types/offer";

const CompanyForm = dynamic(() => import("@/components/forms/CompanyForm").then(mod => mod.CompanyForm), { loading: () => <p className="p-4 text-center text-sm text-zinc-500">Loading form...</p> });
const UserForm = dynamic(() => import("@/components/forms/UserForm").then(mod => mod.UserForm), { loading: () => <p className="p-4 text-center text-sm text-zinc-500">Loading form...</p> });
const OfferForm = dynamic(() => import("@/components/forms/OfferForm").then(mod => mod.OfferForm), { loading: () => <p className="p-4 text-center text-sm text-zinc-500">Loading form...</p> });

interface PaginationData {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface DashboardProps {
  initialUser: IUserDTO;
  initialCompanies: ICompanyDTO[];
  initialOffers: {
    items: IOfferDTO[];
    pagination: PaginationData;
  };
  initialUsers?: IUserDTO[];
}

export default function DashboardClient({ initialUser, initialCompanies, initialOffers, initialUsers = [] }: DashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [user] = useState<IUserDTO>(initialUser);
  const [companies, setCompanies] = useState<ICompanyDTO[]>(initialCompanies);
  const [offers, setOffers] = useState<IOfferDTO[]>(initialOffers.items);
  const [pagination, setPagination] = useState<PaginationData>(initialOffers.pagination);
  const [usersList, setUsersList] = useState<IUserDTO[]>(initialUsers);

  // Tabs & Views
  const [activeTab, setActiveTab] = useState<'offers' | 'companies' | 'users'>('offers');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Search State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  // Copy state tracker for feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals state
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  
  const [selectedCompanyForEdit, setSelectedCompanyForEdit] = useState<ICompanyDTO | null>(null);
  const [selectedOfferForEdit, setSelectedOfferForEdit] = useState<IOfferDTO | null>(null);
  const [selectedOfferForPreview, setSelectedOfferForPreview] = useState<IOfferDTO | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<IUserDTO | null>(null);

  const isAdmin = user.role === 'ADMIN';

  useEffect(() => {
    setOffers(initialOffers.items);
    setPagination(initialOffers.pagination);
  }, [initialOffers]);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setStatusFilter(searchParams.get('status') || '');
    fetchOffers();
  }, [searchParams]);

  const fetchOffers = async () => {
    try {
      const page = searchParams.get('page') || '1';
      const q = searchParams.get('q') || '';
      const status = searchParams.get('status') || '';
      
      const res = await axios.get('/api/v1/offers', {
        params: { page, q, status }
      });
      if (res.data?.success) {
        setOffers(res.data.data.items || res.data.data.offers || []);
        if (res.data.data.pagination) {
          setPagination(res.data.data.pagination);
        }
      }
    } catch (err) {
      console.error("Failed to fetch offers", err);
    }
  };

  const getCompanyName = (company: any) => {
    if (!company) return 'Company';
    if (typeof company === 'object' && company.name) return company.name;
    const found = companies.find(c => c._id === company || c._id === company?._id);
    return found ? found.name : 'Company';
  };

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    router.push(`/dashboard?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters('q', searchQuery);
  };

  const handleLogout = async () => {
    try {
      await axios.post("/api/v1/auth/logout");
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const copyToClipboard = (text: string, label: string, key: string) => {
    if (!text) {
      toast.error("Nothing to copy!");
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDuplicateOffer = (offer: IOfferDTO) => {
    const duplicatedOffer = {
      ...offer,
      _id: undefined,
      reference: '',
      status: 'Draft' as OfferStatus,
    };
    setSelectedOfferForEdit(duplicatedOffer as any);
    setIsOfferModalOpen(true);
  };

  const statuses = ['Draft', 'Pending', 'Approved', 'Rejected', 'Sent', 'Accepted'];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans pb-24">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">OfferFlow</span>
              <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                ENTERPRISE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 bg-zinc-100 dark:bg-zinc-900 px-3.5 py-1.5 rounded-full border border-zinc-200/80 dark:border-zinc-800">
              <div className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{user.username}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {user.role}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-zinc-700 dark:text-zinc-300 hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 dark:hover:border-rose-800 transition-all"
            >
              <LogOut className="h-4 w-4 mr-1.5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Banner with Big Glowing Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-zinc-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-zinc-800 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="h-4 w-4" /> Welcome, {user.name || user.username}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Offer & Company Management Dashboard</h1>
            <p className="text-sm text-zinc-300 max-w-xl leading-relaxed">
              Quickly draft offer letters, copy reference numbers and company IDs with one click, and manage team privileges.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <Button
              onClick={() => { setSelectedOfferForEdit(null); setIsOfferModalOpen(true); }}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xl shadow-indigo-600/40 border border-indigo-400/30 px-6 py-6 text-sm flex items-center gap-2 transform hover:-translate-y-0.5 transition-all"
            >
              <Plus className="h-5 w-5" /> New Offer Letter
            </Button>

            {isAdmin && (
              <Button
                onClick={() => { setSelectedCompanyForEdit(null); setIsCompanyModalOpen(true); }}
                size="lg"
                variant="outline"
                className="bg-zinc-800/80 hover:bg-zinc-800 text-white border-zinc-700 font-bold px-5 py-6 text-sm flex items-center gap-2 transition-all"
              >
                <Building2 className="h-5 w-5 text-indigo-400" /> Add Company
              </Button>
            )}

            {isAdmin && (
              <Button
                onClick={() => { setSelectedUserForEdit(null); setIsUserModalOpen(true); }}
                size="lg"
                variant="outline"
                className="bg-zinc-800/80 hover:bg-zinc-800 text-white border-zinc-700 font-bold px-5 py-6 text-sm flex items-center gap-2 transition-all"
              >
                <Users className="h-5 w-5 text-amber-400" /> Add User
              </Button>
            )}
          </div>
        </div>

        {/* Executive Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Offers</p>
                <h3 className="text-3xl font-extrabold mt-1">{pagination.totalItems || offers.length}</h3>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" /> Active Pipeline
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                <FileText className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Companies</p>
                <h3 className="text-3xl font-extrabold mt-1">{companies.length}</h3>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-1">
                  <Building2 className="h-3 w-3" /> Registered Entities
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                <Building2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">System Users</p>
                <h3 className="text-3xl font-extrabold mt-1">{usersList.length || 1}</h3>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                  <ShieldCheck className="h-3 w-3" /> {isAdmin ? "Admin Access" : "Standard Role"}
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
                <Users className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Pending Review</p>
                <h3 className="text-3xl font-extrabold mt-1">{offers.filter(o => o.status === 'Pending').length}</h3>
                <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" /> Needs Approval
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50">
                <Clock className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Navigation Tabs + Layout View Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('offers')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'offers'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-500/20'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <FileText className="h-4 w-4" /> Offer Letters
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
                {offers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('companies')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'companies'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-500/20'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <Building2 className="h-4 w-4" /> Companies
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
                {companies.length}
              </span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'users'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-500/20'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Users className="h-4 w-4" /> Team Users
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
                  {usersList.length}
                </span>
              </button>
            )}
          </div>

          {/* View Toggles */}
          {activeTab === 'offers' && (
            <div className="flex items-center gap-1 bg-zinc-200/60 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-300/60 dark:border-zinc-800 self-end sm:self-auto">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table' ? 'bg-white dark:bg-zinc-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'
                }`}
              >
                <List className="h-4 w-4" /> Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'
                }`}
              >
                <LayoutGrid className="h-4 w-4" /> Grid Cards
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: OFFER LETTERS SECTION */}
        {activeTab === 'offers' && (
          <section className="space-y-4 animate-in fade-in duration-200">
            {/* Filter Controls */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
              <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search candidate name, position, reference..."
                    className="pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <Button type="submit" variant="outline" className="font-semibold border-zinc-300 dark:border-zinc-700">
                  Search
                </Button>
              </form>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="h-4 w-4 text-zinc-400 hidden sm:block" />
                <div className="w-full sm:w-48">
                  <CustomSelect
                    options={[{ value: '', label: 'All Statuses' }, ...statuses.map(s => ({ value: s, label: s }))]}
                    value={statusFilter}
                    onChange={(val) => updateFilters('status', val)}
                  />
                </div>
              </div>
            </div>

            {/* TABLE VIEW */}
            {viewMode === 'table' ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-zinc-100/70 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="px-5 py-4">Reference Number</th>
                        <th className="px-5 py-4">Candidate Details</th>
                        <th className="px-5 py-4">Company</th>
                        <th className="px-5 py-4">Position</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {offers.map(offer => {
                        const refText = offer.reference || offer._id || "NO-REF";
                        const refKey = `ref-${offer._id}`;
                        const isCopied = copiedKey === refKey;
                        const compName = getCompanyName(offer.company);

                        return (
                          <tr key={offer._id} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors">
                            {/* Reference Number with PROMINENT BUTTON */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800">
                                  {refText}
                                </span>
                                {/* Highly Visible Copy Ref Button */}
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(refText, "Offer Reference", refKey)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all border ${
                                    isCopied
                                      ? "bg-emerald-600 text-white border-emerald-600"
                                      : "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border-indigo-200 dark:border-indigo-800"
                                  }`}
                                  title="Click to Copy Reference Number"
                                >
                                  {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                  {isCopied ? "Copied!" : "Copy Ref"}
                                </button>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="font-bold text-zinc-900 dark:text-zinc-100">{offer.employee.name}</div>
                              <div className="text-xs text-zinc-400">{offer.employee.email}</div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                                {compName}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400 font-medium">
                              {offer.employment.position}
                            </td>

                            {/* SLEEK NON-SHAKING INLINE STATUS SELECTOR */}
                            <td className="px-5 py-4">
                              <select
                                value={offer.status}
                                onChange={async (e) => {
                                  const newStatus = e.target.value as OfferStatus;
                                  setOffers(offers.map(o => o._id === offer._id ? { ...o, status: newStatus } : o));
                                  try {
                                    await axios.patch(`/api/v1/offers/${offer._id}/status`, { status: newStatus });
                                    toast.success('Status updated!');
                                  } catch (err) {
                                    toast.error('Failed to update status');
                                  }
                                }}
                                className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                              >
                                {statuses.map(s => (
                                  <option key={s} value={s} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold">
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Action Buttons Toolbar */}
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedOfferForPreview(offer)}
                                  className="h-8 px-2.5 text-xs font-semibold bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" /> View
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => { setSelectedOfferForEdit(offer); setIsOfferModalOpen(true); }}
                                  className="h-8 px-2.5 text-xs font-semibold border-zinc-200 dark:border-zinc-800"
                                >
                                  <Edit2 className="h-3.5 w-3.5 mr-1 text-indigo-500" /> Edit
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDuplicateOffer(offer)}
                                  className="h-8 px-2.5 text-xs font-semibold border-zinc-200 dark:border-zinc-800"
                                >
                                  <Copy className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Duplicate
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {offers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-zinc-400">
                            <FileText className="h-8 w-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                            No offer letters found matching your search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled={!pagination.hasPrev} onClick={() => handlePageChange(pagination.page - 1)}>
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" disabled={!pagination.hasNext} onClick={() => handlePageChange(pagination.page + 1)}>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* GRID CARDS VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers.map(offer => {
                  const refText = offer.reference || offer._id || "NO-REF";
                  const refKey = `grid-ref-${offer._id}`;
                  const isCopied = copiedKey === refKey;
                  const compName = getCompanyName(offer.company);

                  return (
                    <Card key={offer._id} className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Candidate</span>
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{offer.employee.name}</h3>
                            <p className="text-xs text-zinc-500">{offer.employee.email}</p>
                          </div>
                          
                          {/* SLEEK NON-SHAKING STATUS SELECTOR */}
                          <select
                            value={offer.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value as OfferStatus;
                              setOffers(offers.map(o => o._id === offer._id ? { ...o, status: newStatus } : o));
                              try {
                                await axios.patch(`/api/v1/offers/${offer._id}/status`, { status: newStatus });
                                toast.success('Status updated!');
                              } catch (err) {
                                toast.error('Failed to update status');
                              }
                            }}
                            className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                          >
                            {statuses.map(s => (
                              <option key={s} value={s} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold">
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500 font-medium">Position:</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{offer.employment.position}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500 font-medium">Company:</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> {compName}
                            </span>
                          </div>
                        </div>

                        {/* PROMINENT COPY REF BUTTON ON CARD */}
                        <div className="flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-indigo-500">Ref Code</p>
                            <p className="font-mono text-xs font-extrabold text-indigo-700 dark:text-indigo-300">{refText}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(refText, "Offer Reference", refKey)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                              isCopied
                                ? "bg-emerald-600 text-white"
                                : "bg-indigo-600 text-white hover:bg-indigo-500"
                            }`}
                          >
                            {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {isCopied ? "Copied!" : "Copy Ref"}
                          </button>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOfferForPreview(offer)}
                            className="text-xs font-semibold bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSelectedOfferForEdit(offer); setIsOfferModalOpen(true); }}
                            className="text-xs font-semibold"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicateOffer(offer)}
                            className="text-xs font-semibold"
                          >
                            <Copy className="h-3.5 w-3.5 mr-1" /> Duplicate
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: COMPANIES SECTION */}
        {activeTab === 'companies' && (
          <section className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-500" /> Companies List & IDs
              </h2>
              {isAdmin && (
                <Button onClick={() => { setSelectedCompanyForEdit(null); setIsCompanyModalOpen(true); }} size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  <Plus className="mr-1.5 h-4 w-4" /> Add Company
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map(company => {
                const compId = company._id || '';
                const compKey = `comp-${compId}`;
                const isCopied = copiedKey === compKey;

                return (
                  <Card key={company._id} className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold text-lg flex items-center justify-center border border-indigo-500/20">
                            {company.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">{company.name}</h3>
                            {isAdmin && <span className="text-[11px] text-zinc-400 font-mono">ID: {compId.substring(0, 10)}...</span>}
                          </div>
                        </div>

                        {/* EXPLICIT COPY COMPANY ID BUTTON FOR ADMIN ONLY */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(compId, "Company ID", compKey)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              isCopied
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-600 hover:text-white border-zinc-200 dark:border-zinc-700"
                            }`}
                            title="Copy Company ID"
                          >
                            {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {isCopied ? "Copied!" : "Copy ID"}
                          </button>
                        )}
                      </div>

                      {company.defaultOfferTemplate && (
                        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3">
                          {company.defaultOfferTemplate}
                        </div>
                      )}

                      {isAdmin && (
                        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(company.defaultOfferTemplate || company.name, "Connection Prompt", `tpl-${compId}`)}
                            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1.5"
                          >
                            <Copy className="h-3.5 w-3.5" /> Copy connection prompt
                          </button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSelectedCompanyForEdit(company); setIsCompanyModalOpen(true); }}
                            className="h-7 text-xs font-semibold"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 3: TEAM USERS SECTION */}
        {activeTab === 'users' && isAdmin && (
          <section className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" /> Team Accounts & Roles
              </h2>
              <Button onClick={() => { setSelectedUserForEdit(null); setIsUserModalOpen(true); }} size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <Plus className="mr-1.5 h-4 w-4" /> Add User
              </Button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-zinc-100/70 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="px-5 py-4">User Name</th>
                      <th className="px-5 py-4">Username</th>
                      <th className="px-5 py-4">Role</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                    {usersList.map(u => (
                      <tr key={u._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-5 py-4 font-bold text-zinc-900 dark:text-zinc-100">{u.name || u.username}</td>
                        <td className="px-5 py-4 text-zinc-500 font-mono">{u.username}</td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                            u.active 
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          }`}>
                            {u.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSelectedUserForEdit(u); setIsUserModalOpen(true); }}
                            className="h-8 px-3 text-xs font-semibold"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1 text-indigo-500" /> Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-zinc-400">
                          No user accounts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Modals */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={selectedUserForEdit ? "Edit Team Member" : "Create New User"}
        description={selectedUserForEdit ? "Update user account settings." : "Add a new HR or Admin user to the system."}
      >
        <UserForm
          initialData={selectedUserForEdit || undefined}
          onSuccess={() => { setIsUserModalOpen(false); router.refresh(); }}
          onCancel={() => setIsUserModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        title={selectedCompanyForEdit ? "Edit Company" : "Create New Company"}
        description={selectedCompanyForEdit ? "Modify company information." : "Register a new company profile."}
      >
        <CompanyForm
          initialData={selectedCompanyForEdit || undefined}
          onSuccess={() => { setIsCompanyModalOpen(false); router.refresh(); }}
          onCancel={() => setIsCompanyModalOpen(false)}
        />
      </Modal>

      {/* Offer Form Modal with Instant Fetch Update */}
      <Modal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        title={selectedOfferForEdit ? "Edit Offer Letter" : "Create Offer Letter"}
        description={selectedOfferForEdit ? "Update details for this offer letter." : "Draft a new formal offer letter for a candidate."}
        size="xl"
      >
        <OfferForm
          initialData={selectedOfferForEdit || undefined}
          onSuccess={() => {
            setIsOfferModalOpen(false);
            fetchOffers();
            router.refresh();
          }}
          onCancel={() => setIsOfferModalOpen(false)}
        />
      </Modal>

      {/* EXACT DOCUMENT PREVIEW MODAL */}
      <Modal
        isOpen={!!selectedOfferForPreview}
        onClose={() => setSelectedOfferForPreview(null)}
        title="Offer Letter Document Preview"
        description={`Official Document Preview for ${selectedOfferForPreview?.employee?.name || 'Candidate'}`}
        size="2xl"
      >
        {selectedOfferForPreview && (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-8 rounded-2xl space-y-5 shadow-lg text-xs leading-relaxed font-sans text-zinc-900 dark:text-zinc-100">
            {/* Formal Letterhead */}
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-indigo-600 dark:text-indigo-400">
                  {getCompanyName(selectedOfferForPreview.company).toUpperCase()}
                </h3>
                <p className="text-[11px] text-zinc-400">Official Formal Offer Letter</p>
              </div>
              <div className="text-right text-[11px] space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  STATUS: {(selectedOfferForPreview.status || 'Draft').toUpperCase()}
                </span>
                <p className="text-zinc-400">Ref: {selectedOfferForPreview.reference || selectedOfferForPreview._id || 'OFFER-REF'}</p>
                <p className="text-zinc-400">Date: {new Date(selectedOfferForPreview.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Document Body Content matching Offer Letter Body Content exactly */}
            <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed bg-zinc-50 dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
              {selectedOfferForPreview.offerContent}
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(selectedOfferForPreview.offerContent, "Offer Letter Text", `prev-text-${selectedOfferForPreview._id}`)}
                className="text-xs font-bold"
              >
                <Copy className="h-4 w-4 mr-1.5" /> Copy Full Offer Text
              </Button>
              <Button onClick={() => setSelectedOfferForPreview(null)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
