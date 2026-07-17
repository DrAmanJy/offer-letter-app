"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Building2, FileText, ChevronRight, LogOut, Plus, Edit2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CompanyForm } from "@/components/forms/CompanyForm";
import { UserForm } from "@/components/forms/UserForm";
import { OfferForm } from "@/components/forms/OfferForm";
import { CustomSelect } from "@/components/ui/Select";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedCompanyForEdit, setSelectedCompanyForEdit] = useState<any>(null);
  const [selectedOfferForEdit, setSelectedOfferForEdit] = useState<any>(null);
  const [selectedOfferView, setSelectedOfferView] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [userRes, compRes, offersRes] = await Promise.all([
        axios.get("/api/v1/auth/me"),
        axios.get("/api/v1/companies"),
        axios.get("/api/v1/offers")
      ]);

      if (userRes.data?.success) setUser(userRes.data.data);
      if (compRes.data?.success) setCompanies(compRes.data.data.companies || []);
      if (offersRes.data?.success) setOffers(offersRes.data.data.items || []);
      
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push("/login");
      } else {
        setError("Failed to load dashboard data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      await axios.post("/api/v1/auth/logout");
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10">
        <CardHeader>
          <CardTitle className="text-red-800 dark:text-red-400">Error</CardTitle>
          <CardDescription className="text-red-600 dark:text-red-300">
            {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* Welcome & Actions Section */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Welcome back, {user?.name || "User"}
            </h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              Here's an overview of your companies and offer letters.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setIsUserModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New User
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Side-by-Side Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Companies Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Companies
                </h2>
              </div>
              <Button size="sm" onClick={() => setIsCompanyModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Button>
            </div>
            <div className="grid gap-4">
              {companies.length > 0 ? (
                companies.slice(0, 5).map((company) => (
                  <Card key={company._id} className="group transition-all hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">{company.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                            ID: {company._id}
                          </p>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(company._id);
                              toast.success('Company ID copied!');
                            }}
                            className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setSelectedCompanyForEdit(company);
                            setIsCompanyModalOpen(true);
                          }}
                          className="p-2 text-zinc-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="flex h-32 flex-col items-center justify-center border-dashed bg-zinc-50/50 dark:bg-zinc-900/20">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">No companies found</p>
                </Card>
              )}
            </div>
          </section>

          {/* Offer Letters Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Offer Letters
                </h2>
              </div>
              <Button size="sm" onClick={() => setIsOfferModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Offer
              </Button>
            </div>
            <div className="grid gap-4">
              {offers.length > 0 ? (
                offers.slice(0, 5).map((offer) => (
                  <Card key={offer._id} className="group transition-all hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <h3 
                          className="font-medium text-zinc-900 dark:text-zinc-50 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => setSelectedOfferView(offer)}
                        >
                          {offer.employee?.name || "Candidate"} - {offer.reference}
                        </h3>
                        <div className="flex items-center gap-2 mt-2 max-w-[150px]">
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">Status:</p>
                          <CustomSelect
                            options={['Draft', 'Sent', 'Opened', 'Accepted', 'Rejected', 'Cancelled', 'Expired'].map(s => ({ value: s, label: s }))}
                            value={offer.status}
                            onChange={async (newStatus) => {
                              try {
                                const res = await axios.patch(`/api/v1/offers/${offer._id}/status`, { status: newStatus });
                                if (res.data.success) {
                                  setOffers(offers.map(o => o._id === offer._id ? { ...o, status: newStatus } : o));
                                  toast.success('Status updated');
                                }
                              } catch (err) {
                                toast.error('Failed to update status');
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setSelectedOfferForEdit(offer);
                            setIsOfferModalOpen(true);
                          }}
                          className="p-2 text-zinc-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="flex h-32 flex-col items-center justify-center border-dashed bg-zinc-50/50 dark:bg-zinc-900/20">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">No offer letters found</p>
                </Card>
              )}
            </div>
          </section>
        </div>
      </motion.div>

      {/* Modals */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Create New User"
        description="Add a new admin or HR user to the platform."
      >
        <UserForm onSuccess={() => { setIsUserModalOpen(false); fetchData(); }} />
      </Modal>

      <Modal
        isOpen={isCompanyModalOpen}
        onClose={() => { setIsCompanyModalOpen(false); setSelectedCompanyForEdit(null); }}
        title={selectedCompanyForEdit ? "Edit Company" : "Create New Company"}
        description={selectedCompanyForEdit ? "Update the company details." : "Add a new company to associate offer letters with."}
      >
        <CompanyForm initialData={selectedCompanyForEdit} onSuccess={() => { setIsCompanyModalOpen(false); setSelectedCompanyForEdit(null); fetchData(); }} />
      </Modal>

      <Modal
        isOpen={isOfferModalOpen}
        onClose={() => { setIsOfferModalOpen(false); setSelectedOfferForEdit(null); }}
        title={selectedOfferForEdit ? "Edit Offer Letter" : "Create Offer Letter"}
        description={selectedOfferForEdit ? "Update the offer letter details." : "Draft a new offer letter for a candidate."}
      >
        <OfferForm initialData={selectedOfferForEdit} onSuccess={() => { setIsOfferModalOpen(false); setSelectedOfferForEdit(null); fetchData(); }} />
      </Modal>

      <Modal
        isOpen={!!selectedOfferView}
        onClose={() => setSelectedOfferView(null)}
        title="Offer Letter Details"
        description={`Reference: ${selectedOfferView?.reference}`}
      >
        {selectedOfferView && (
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Candidate Name</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{selectedOfferView.employee.name}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Email</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{selectedOfferView.employee.email}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Position</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{selectedOfferView.employment.position}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Salary</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{selectedOfferView.employment.salary} {selectedOfferView.employment.currency}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Joining Date</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {new Date(selectedOfferView.employment.joiningDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Status</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{selectedOfferView.status}</p>
              </div>
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 mb-1">Offer Content</p>
              <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 whitespace-pre-wrap">
                {selectedOfferView.offerContent}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
