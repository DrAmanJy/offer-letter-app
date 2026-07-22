"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Sparkles, Eye, Edit3, User, Briefcase, FileText } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { CustomSelect } from "@/components/ui/Select";
import { IOfferDTO } from "@/types/offer";

const schema = z.object({
  company: z.string().min(1, "Company is required"),
  status: z.enum(['Draft', 'Pending', 'Approved', 'Rejected', 'Sent', 'Accepted']).optional(),
  employee: z.object({
    name: z.string().min(1, "Employee name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().optional(),
    nationality: z.string().optional(),
    passportNumber: z.string().optional(),
  }),
  employment: z.object({
    position: z.string().min(1, "Position is required"),
    department: z.string().optional(),
    location: z.string().optional(),
    employmentType: z.string().optional(),
    standardHours: z.string().optional(),
    salary: z.coerce.number().positive("Salary must be positive"),
    currency: z.string().min(1, "Currency is required"),
    joiningDate: z.string().min(1, "Joining date is required"),
    managerName: z.string().optional(),
    probationPeriod: z.string().optional(),
    noticePeriod: z.string().optional(),
  }),
  terms: z.string().optional(),
  offerContent: z.string().min(1, "Offer content is required"),
});

type FormValues = z.input<typeof schema>;

export function OfferForm({ onSuccess, onCancel, initialData }: { onSuccess: () => void, onCancel: () => void, initialData?: IOfferDTO }) {
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  useEffect(() => {
    axios.get("/api/v1/companies").then((res) => {
      if (res.data?.success) {
        setCompanies(res.data.data.companies || []);
      }
    });
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      ...initialData,
      status: initialData.status || 'Draft',
      employee: {
        name: initialData.employee?.name || "",
        email: initialData.employee?.email || "",
        phone: initialData.employee?.phone || "",
        nationality: initialData.employee?.nationality || "",
        passportNumber: initialData.employee?.passportNumber || "",
      },
      employment: {
        position: initialData.employment?.position || "",
        department: initialData.employment?.department || "",
        location: initialData.employment?.location || "",
        employmentType: initialData.employment?.employmentType || "Full-Time",
        standardHours: initialData.employment?.standardHours || "40 hours/week",
        salary: initialData.employment?.salary || 0,
        currency: initialData.employment?.currency || "USD",
        joiningDate: initialData.employment?.joiningDate ? new Date(initialData.employment.joiningDate).toISOString().split('T')[0] : "",
        managerName: initialData.employment?.managerName || "",
        probationPeriod: initialData.employment?.probationPeriod || "3 Months",
        noticePeriod: initialData.employment?.noticePeriod || "30 Days",
      },
      terms: initialData.terms || "",
      company: typeof initialData.company === 'object' ? initialData.company._id : initialData.company,
      offerContent: initialData.offerContent || "",
    } : {
      status: 'Draft',
      employee: { name: "", email: "", phone: "", nationality: "", passportNumber: "" },
      employment: {
        position: "",
        department: "",
        location: "Remote / On-Site",
        employmentType: "Full-Time",
        standardHours: "40 hours/week",
        currency: "USD",
        joiningDate: new Date().toISOString().split('T')[0],
        probationPeriod: "3 Months",
        noticePeriod: "30 Days",
      },
      offerContent: "",
    }
  });

  const selectedCompanyId = watch("company");
  const currentStatus = watch("status") || "Draft";
  const employeeName = watch("employee.name");
  const position = watch("employment.position");
  const salary = watch("employment.salary");
  const currency = watch("employment.currency");
  const joiningDate = watch("employment.joiningDate");
  const location = watch("employment.location");
  const departmentStr = watch("employment.department") || "Operations";
  const hoursStr = watch("employment.standardHours") || "40 hours/week";
  const currentOfferContent = watch("offerContent");

  const selectedCompanyObj = companies.find(c => c._id === selectedCompanyId);
  const companyName = selectedCompanyObj?.name || "Our Company";

  const generateTemplate = (preset: 'standard' | 'tech' | 'executive' | 'remote' | 'sales' | 'contractor') => {
    let template = "";
    const nameStr = employeeName ? employeeName.toUpperCase() : '[CANDIDATE NAME]';

    if (preset === 'standard') {
      template = `CONFIDENTIAL FORMAL OFFER OF EMPLOYMENT

DATE: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
TO: ${nameStr}

Dear ${nameStr},

On behalf of ${companyName}, I am delighted to extend a formal offer of employment for the position of ${position || '[JOB POSITION]'}. We believe your skills and professional experience will make a significant contribution to our growth and team success.

1. APPOINTMENT & POSITION DETAILS
Position Title: ${position || '[JOB POSITION]'}
Department: ${departmentStr}
Employment Status: ${watch("employment.employmentType") || 'Full-Time'}
Primary Work Location: ${location || 'Main Corporate Office'}
Scheduled Start Date: ${joiningDate || '[JOINING DATE]'}
Standard Hours: ${hoursStr}

2. FINANCIAL COMPENSATION & PAYROLL
Your initial base compensation will be ${currency || 'USD'} ${salary || '0'} per annum, paid bi-weekly in accordance with the standard payroll schedule of ${companyName}. Annual compensation is subject to review based on individual performance and company milestone evaluations.

3. BENEFITS, HEALTH & LEAVE POLICIES
You will be eligible to participate in the standard benefit programs established for employees of ${companyName}:
• Health Coverage: Full medical, dental, and vision insurance starting on your first day.
• Paid Leave: 20 days of paid vacation per year plus recognized company holidays.
• Pension & Savings: 401(k) / retirement matching program eligible after 90 days.

4. POLICIES & PROBATIONARY PERIOD
Your employment will be subject to a initial probationary evaluation period of ${watch("employment.probationPeriod") || '3 Months'}. Either party may terminate employment during or after this period in accordance with applicable notice period guidelines (${watch("employment.noticePeriod") || '30 Days'}).

5. CONFIDENTIALITY & PROPRIETARY INFORMATION
As an employee of ${companyName}, you will have access to confidential customer data, trade secrets, and business strategy. You will be required to sign and abide by our Employee Confidentiality Agreement.

Sincerely,
People Operations & HR Department
${companyName}`;
    } else if (preset === 'tech') {
      template = `ENGINEERING & TECH OFFER: WELCOME TO ${companyName.toUpperCase()}

DATE: ${new Date().toLocaleDateString()}
RE: Technical Employment Offer for ${nameStr}

Hi ${nameStr},

We were extremely impressed by your technical background, system architecture knowledge, and problem-solving mindset during our interviews. We are thrilled to offer you the role of ${position || '[TECH ROLE]'} at ${companyName}!

OFFER OVERVIEW & COMPENSATION PACKAGE
Role Title: ${position || '[TECH ROLE]'}
Engineering Team: ${departmentStr}
Annual Base Salary: ${currency || 'USD'} ${salary || '0'} / Year
Target Start Date: ${joiningDate || '[START DATE]'}
Work Setup: ${location || 'Hybrid / Flexible Remote'}
Standard Working Hours: ${hoursStr}

EQUIPMENT, PERKS & TECH HIGHLIGHTS
• Hardware Stipend: $1,500 one-time workstation budget for custom gear and accessories.
• Learning & Development: $1,000 annual budget for technical certifications, courses, and conferences.
• Flexible PTO: Generous paid leave policy plus dedicated mental wellness days.
• Health & Medical: 100% company-covered health, vision, and dental insurance premiums.

DEVELOPMENT ENVIRONMENT & EXPECTATIONS
In this role, you will collaborate closely with cross-functional engineering teams, lead architectural reviews, write clean tested code, and deliver scalable systems to our global user base.

We are excited about the prospect of having you on board!

Best regards,
Engineering Leadership & Talent Team
${companyName}`;
    } else if (preset === 'remote') {
      template = `GLOBAL DISTRIBUTED REMOTE EMPLOYMENT OFFER

DATE: ${new Date().toLocaleDateString()}
TO: ${nameStr}

Dear ${nameStr},

${companyName} is delighted to offer you a full-time remote position as ${position || '[POSITION]'}. As a distributed global organization, we value autonomy, transparent communication, and continuous outcome-focused execution.

REMOTE EMPLOYMENT TERMS & CONDITIONS
Position Title: ${position || '[POSITION]'}
Department: ${departmentStr}
Annual Base Compensation: ${currency || 'USD'} ${salary || '0'} per year
Work Location: 100% Fully Remote (${location || 'Global Remote'})
Core Hours Schedule: ${hoursStr}
Expected Start Date: ${joiningDate || '[START DATE]'}

HOME OFFICE ALLOWANCE & UTILITIES
• Monthly Connectivity Stipend: $100 monthly internet and communication reimbursement.
• Hardware Dispatch: High-performance laptop, security hardware token, and accessories delivered directly to your home address prior to your start date.
• Flexible Working Hours: Work in your local timezone with core overlap hours for team collaboration.

INTELLECTUAL PROPERTY & REMOTE COMPLIANCE
All code, documentation, strategic assets, and work products generated during your employment remain the exclusive property of ${companyName}.

Sincerely,
Global People Operations Team
${companyName}`;
    } else if (preset === 'sales') {
      template = `GROWTH & SALES LEADERSHIP OFFER

DATE: ${new Date().toLocaleDateString()}
RE: Commercial Leadership Offer for ${nameStr}

Dear ${nameStr},

${companyName} is excited to extend this offer of employment for the role of ${position || '[SALES POSITION]'} to drive our revenue growth and market expansion strategies.

COMPENSATION STRUCTURE & OTE TARGETS
Position Title: ${position || '[SALES POSITION]'}
Department: ${departmentStr}
Base Salary: ${currency || 'USD'} ${salary || '0'} / Year
On-Target Earnings (OTE): Uncapped commission incentive structure linked to quarterly quotas
Start Date: ${joiningDate || '[START DATE]'}
Work Location: ${location || 'On-Site / Field Sales'}

COMMISSION REWARDS & EXCLUSIVE BENEFITS
• Accelerated Tiers: Commission rates increase by 1.5x upon exceeding 100% of assigned revenue quota.
• Corporate Travel: Expense account for client meetings, industry summits, and business travel.
• Sales Tools & Stack: Full access to premium CRM, intelligence, and sales automation platforms.

Sincerely,
Chief Commercial Officer & HR Team
${companyName}`;
    } else if (preset === 'contractor') {
      template = `INDEPENDENT CONTRACTOR & ADVISORY AGREEMENT

DATE: ${new Date().toLocaleDateString()}
CONTRACTOR: ${nameStr}

Dear ${nameStr},

This letter confirms the agreement between ${companyName} and ${nameStr} regarding independent consulting and professional advisory services.

SCOPE OF SERVICES & CONTRACT TERMS
Role / Title: ${position || '[CONSULTANT / CONTRACTOR ROLE]'}
Department / Domain: ${departmentStr}
Contract Retainer Fee: ${currency || 'USD'} ${salary || '0'} / Year (or agreed billing rate)
Commencement Date: ${joiningDate || '[START DATE]'}
Primary Work Setup: ${location || 'Independent / Remote'}

INVOICING & INDEPENDENT STATUS
• Billing Cycle: Invoices submitted at the end of each month, payable Net-15 days.
• Relationship: Contractor operates as an independent contractor, responsible for all local tax filings and insurance.

Sincerely,
Legal & Procurement Department
${companyName}`;
    } else {
      template = `EXECUTIVE EMPLOYMENT AGREEMENT & OFFER

CONFIDENTIAL - FOR INTENDED RECIPIENT ONLY
DATE: ${new Date().toLocaleDateString()}
TO: ${nameStr}

Dear ${nameStr},

On behalf of the Board of Directors and Executive Officers of ${companyName}, it is my privilege to formally offer you the executive position of ${position || '[EXECUTIVE TITLE]'}.

1. EXECUTIVE APPOINTMENT & GOVERNANCE
You will serve as ${position || '[EXECUTIVE TITLE]'}, reporting directly to the Board of Directors and Chief Executive Officer starting on ${joiningDate || '[DATE]'}. Your strategic focus will encompass global growth, operational governance, and organizational scale.

2. EXECUTIVE COMPENSATION & INCENTIVES
• Annual Base Compensation: ${currency || 'USD'} ${salary || '0'} Annual Base Salary
• Short-Term Incentive (STI): Annual executive performance bonus targeted up to 40% of base salary.
• Long-Term Incentive (LTI): Eligible for executive equity grants / stock options subject to Board approval.

3. EXECUTIVE BENEFITS & CONFIDENTIALITY
• Tier-1 Health & Coverage: Full executive medical, dental, life, and D&O liability protection.
• Confidentiality & Non-Compete: Subject to customary executive fiduciary responsibilities and IP assignment.

Sincerely,
Board of Directors & Office of the CEO
${companyName}`;
    }

    setValue("offerContent", template, { shouldValidate: true });
    toast.success("Detailed template loaded!");
  };

  const insertFormatSnippet = (snippetType: string) => {
    let snippet = "";
    switch (snippetType) {
      case 'header':
        snippet = `\nSECTION HEADER\n\n`;
        break;
      case 'bullets':
        snippet = `\n• Key Responsibility / Term 1\n• Key Responsibility / Term 2\n• Key Responsibility / Term 3\n`;
        break;
      case 'terms':
        snippet = `\nCONFIDENTIALITY & TERMS:\nThis offer letter is confidential and conditioned upon successful background verification.\n`;
        break;
      default:
        break;
    }
    const newContent = (currentOfferContent || "") + snippet;
    setValue("offerContent", newContent, { shouldValidate: true });
  };

  const insertToken = (token: string) => {
    const newContent = (currentOfferContent || "") + " " + token;
    setValue("offerContent", newContent, { shouldValidate: true });
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        employment: {
          ...data.employment,
          joiningDate: new Date(data.employment.joiningDate).toISOString(),
        }
      };
      
      if (initialData?._id) {
        const response = await axios.put(`/api/v1/offers/${initialData._id}`, payload);
        if (response.data?.success) {
          toast.success("Offer Letter updated successfully");
          onSuccess();
        }
      } else {
        const response = await axios.post("/api/v1/offers", payload);
        if (response.data?.success) {
          toast.success("Offer Letter created successfully");
          onSuccess();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${initialData ? 'update' : 'create'} offer letter`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Company Selector & Offer Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company" className="font-bold flex items-center gap-1.5 text-xs">
            <Briefcase className="h-4 w-4 text-indigo-500" /> Select Company *
          </Label>
          <CustomSelect
            options={companies.map(c => ({ value: c._id, label: c.name }))}
            value={selectedCompanyId}
            onChange={(val) => setValue("company", val, { shouldValidate: true })}
            placeholder="Select a company"
            disabled={isLoading}
          />
          {errors.company && <p className="text-xs text-red-500">{errors.company.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status" className="font-bold flex items-center gap-1.5 text-xs">
            <Sparkles className="h-4 w-4 text-indigo-500" /> Offer Status *
          </Label>
          <CustomSelect
            options={[
              { value: 'Draft', label: 'Draft' },
              { value: 'Pending', label: 'Pending Review' },
              { value: 'Approved', label: 'Approved' },
              { value: 'Sent', label: 'Sent to Candidate' },
              { value: 'Accepted', label: 'Accepted' },
              { value: 'Rejected', label: 'Rejected' },
            ]}
            value={currentStatus}
            onChange={(val) => setValue("status", val as any, { shouldValidate: true })}
            placeholder="Select offer status"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Employee Details Section */}
      <div className="space-y-3 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <User className="h-4 w-4 text-indigo-500" /> Candidate Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Candidate Name *</Label>
            <Input placeholder="John Doe" disabled={isLoading} {...register("employee.name")} />
            {errors.employee?.name && <p className="text-xs text-red-500">{errors.employee.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email Address *</Label>
            <Input type="email" placeholder="john@example.com" disabled={isLoading} {...register("employee.email")} />
            {errors.employee?.email && <p className="text-xs text-red-500">{errors.employee.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Phone Number</Label>
            <Input placeholder="+1 555 123 4567" disabled={isLoading} {...register("employee.phone")} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nationality</Label>
            <Input placeholder="e.g. American, Indian" disabled={isLoading} {...register("employee.nationality")} />
          </div>
        </div>
      </div>

      {/* Employment Details Section */}
      <div className="space-y-3 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-indigo-500" /> Position & Compensation
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Job Position Input with Datalist + Suggestions */}
          <div className="space-y-1.5">
            <Label className="text-xs">Job Position *</Label>
            <Input
              list="position-list"
              placeholder="Type or pick position..."
              disabled={isLoading}
              {...register("employment.position")}
            />
            <datalist id="position-list">
              <option value="Software Engineer" />
              <option value="Senior Full Stack Developer" />
              <option value="Product Manager" />
              <option value="UI/UX Designer" />
              <option value="DevOps Engineer" />
              <option value="HR Specialist" />
              <option value="Data Analyst" />
              <option value="Sales Executive" />
            </datalist>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {['Software Engineer', 'Product Manager', 'Designer', 'HR Lead'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setValue("employment.position", p, { shouldValidate: true })}
                  className="text-[10px] px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
            {errors.employment?.position && <p className="text-xs text-red-500">{errors.employment.position.message}</p>}
          </div>

          {/* Department Input with Datalist + Suggestions */}
          <div className="space-y-1.5">
            <Label className="text-xs">Department</Label>
            <Input
              list="department-list"
              placeholder="Type or pick department..."
              disabled={isLoading}
              {...register("employment.department")}
            />
            <datalist id="department-list">
              <option value="Engineering" />
              <option value="Product & Design" />
              <option value="Human Resources" />
              <option value="Sales & Marketing" />
              <option value="Customer Success" />
              <option value="Operations" />
              <option value="Finance & Legal" />
            </datalist>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {['Engineering', 'HR', 'Product', 'Sales'].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setValue("employment.department", d, { shouldValidate: true })}
                  className="text-[10px] px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Location Input */}
          <div className="space-y-1.5">
            <Label className="text-xs">Work Location</Label>
            <Input placeholder="New York / Remote" disabled={isLoading} {...register("employment.location")} />
          </div>

          {/* Salary Input */}
          <div className="space-y-1.5">
            <Label className="text-xs">Salary *</Label>
            <Input type="number" placeholder="95000" disabled={isLoading} {...register("employment.salary")} />
            {errors.employment?.salary && <p className="text-xs text-red-500">{errors.employment.salary.message}</p>}
          </div>

          {/* Currency Select-Only Option */}
          <div className="space-y-1.5">
            <Label className="text-xs">Currency *</Label>
            <CustomSelect
              options={[
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GBP', label: 'GBP (£)' },
                { value: 'INR', label: 'INR (₹)' },
                { value: 'AED', label: 'AED (Dirham)' },
                { value: 'CAD', label: 'CAD ($)' },
                { value: 'AUD', label: 'AUD ($)' },
                { value: 'SGD', label: 'SGD ($)' },
                { value: 'SAR', label: 'SAR (Riyal)' },
                { value: 'QAR', label: 'QAR (Riyal)' },
              ]}
              value={watch("employment.currency")}
              onChange={(val) => setValue("employment.currency", val, { shouldValidate: true })}
              placeholder="Select currency"
              disabled={isLoading}
            />
            {errors.employment?.currency && <p className="text-xs text-red-500">{errors.employment.currency.message}</p>}
          </div>

          {/* Joining Date Input */}
          <div className="space-y-1.5">
            <Label className="text-xs">Joining Date *</Label>
            <Input type="date" disabled={isLoading} {...register("employment.joiningDate")} />
            {errors.employment?.joiningDate && <p className="text-xs text-red-500">{errors.employment.joiningDate.message}</p>}
          </div>
        </div>
      </div>

      {/* Offer Content Editor & Live Preview */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-500" />
            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Offer Letter Body Content</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 rounded-md transition-all ${activeTab === 'editor' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-500'}`}
              >
                <Edit3 className="h-3.5 w-3.5 inline mr-1" /> Rich Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-500'}`}
              >
                <Eye className="h-3.5 w-3.5 inline mr-1" /> Document Preview
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'editor' ? (
          <div className="space-y-3">
            {/* Preset Template Options */}
            <div className="flex flex-wrap items-center gap-2 bg-indigo-50/60 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-xs">
              <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Professional Template Presets:
              </span>
              <button
                type="button"
                onClick={() => generateTemplate('standard')}
                className="px-2.5 py-1 bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg border border-indigo-200 dark:border-indigo-800 font-bold transition-all shadow-sm"
              >
                Corporate Standard
              </button>
              <button
                type="button"
                onClick={() => generateTemplate('tech')}
                className="px-2.5 py-1 bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg border border-indigo-200 dark:border-indigo-800 font-bold transition-all shadow-sm"
              >
                Startup Tech
              </button>
              <button
                type="button"
                onClick={() => generateTemplate('remote')}
                className="px-2.5 py-1 bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg border border-indigo-200 dark:border-indigo-800 font-bold transition-all shadow-sm"
              >
                Global Remote
              </button>
              <button
                type="button"
                onClick={() => generateTemplate('sales')}
                className="px-2.5 py-1 bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg border border-indigo-200 dark:border-indigo-800 font-bold transition-all shadow-sm"
              >
                Sales & Growth
              </button>
              <button
                type="button"
                onClick={() => generateTemplate('contractor')}
                className="px-2.5 py-1 bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg border border-indigo-200 dark:border-indigo-800 font-bold transition-all shadow-sm"
              >
                Contractor / Consulting
              </button>
              <button
                type="button"
                onClick={() => generateTemplate('executive')}
                className="px-2.5 py-1 bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg border border-indigo-200 dark:border-indigo-800 font-bold transition-all shadow-sm"
              >
                Executive Leadership
              </button>
            </div>

            {/* Quick Formatting Tool Bar & Field Tokens */}
            <div className="bg-zinc-100/70 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-zinc-500 font-bold mr-1">Insert Blocks:</span>
                <button type="button" onClick={() => insertFormatSnippet('header')} className="px-2 py-0.5 bg-white dark:bg-zinc-800 hover:bg-indigo-600 hover:text-white rounded border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold transition-all">
                  + Section Header
                </button>
                <button type="button" onClick={() => insertFormatSnippet('bullets')} className="px-2 py-0.5 bg-white dark:bg-zinc-800 hover:bg-indigo-600 hover:text-white rounded border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold transition-all">
                  + Bullet Points
                </button>
                <button type="button" onClick={() => insertFormatSnippet('terms')} className="px-2 py-0.5 bg-white dark:bg-zinc-800 hover:bg-indigo-600 hover:text-white rounded border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold transition-all">
                  + Confidentiality
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-zinc-400 font-semibold mr-1">Insert Field Token:</span>
                <button type="button" onClick={() => insertToken("{status}")} className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-600 hover:text-white rounded border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-mono font-bold transition-all">
                  status
                </button>
                <button type="button" onClick={() => insertToken("{candidate_name}")} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white rounded border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono transition-all">
                  candidate_name
                </button>
                <button type="button" onClick={() => insertToken("{position}")} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white rounded border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono transition-all">
                  position
                </button>
                <button type="button" onClick={() => insertToken("{salary}")} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white rounded border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono transition-all">
                  salary
                </button>
                <button type="button" onClick={() => insertToken("{company_name}")} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white rounded border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono transition-all">
                  company_name
                </button>
              </div>
            </div>

            <textarea
              disabled={isLoading}
              {...register("offerContent")}
              rows={14}
              className="w-full rounded-xl border border-zinc-200 bg-white p-4 font-mono text-xs leading-relaxed shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="Write or edit offer letter body text..."
            />
            {errors.offerContent && <p className="text-xs text-red-500">{errors.offerContent.message}</p>}
          </div>
        ) : (
          /* EXECUTIVE STYLED DOCUMENT PREVIEW WITH STATUS */
          <div className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-8 rounded-2xl space-y-5 shadow-lg text-xs leading-relaxed font-sans text-zinc-900 dark:text-zinc-100 min-h-[300px]">
            {/* Letterhead Header */}
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-indigo-600 dark:text-indigo-400">
                  {companyName.toUpperCase()}
                </h3>
                <p className="text-[11px] text-zinc-400">Official Formal Offer Letter</p>
              </div>
              <div className="text-right text-[11px] space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  STATUS: {currentStatus.toUpperCase()}
                </span>
                <p className="text-zinc-400">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
              {currentOfferContent || (
                <p className="text-zinc-400 italic text-center py-8">
                  No content entered yet. Choose a template preset above or type in the Rich Editor.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="pt-4 flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
          {isLoading ? "Saving Offer..." : initialData ? "Update Offer" : "Create Offer"}
        </Button>
      </div>
    </form>
  );
}
