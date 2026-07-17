"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { CustomSelect } from "@/components/ui/Select";

const schema = z.object({
  company: z.string().min(1, "Company is required"),
  employee: z.object({
    name: z.string().min(1, "Employee name is required"),
    email: z.string().email("Invalid email"),
  }),
  employment: z.object({
    position: z.string().min(1, "Position is required"),
    salary: z.coerce.number().positive("Salary must be positive"),
    currency: z.string().min(1, "Currency is required"),
    joiningDate: z.string().min(1, "Joining date is required"),
  }),
  offerContent: z.string().min(1, "Offer content is required"),
});

type FormValues = z.input<typeof schema>;

export function OfferForm({ onSuccess, initialData }: { onSuccess: () => void, initialData?: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    // Fetch companies for the dropdown
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
      employment: {
        ...initialData.employment,
        joiningDate: initialData.employment?.joiningDate ? new Date(initialData.employment.joiningDate).toISOString().split('T')[0] : "",
      },
      company: typeof initialData.company === 'object' ? initialData.company._id : initialData.company,
    } : {
      employment: { currency: "USD" }
    }
  });

  const selectedCompany = watch("company");

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      // Ensure date is ISO
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
      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <CustomSelect
          options={companies.map(c => ({ value: c._id, label: c.name }))}
          value={selectedCompany}
          onChange={(val) => setValue("company", val, { shouldValidate: true })}
          placeholder="Select a company"
          disabled={isLoading}
        />
        {errors.company && <p className="text-xs text-red-500">{errors.company.message}</p>}
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 border-b pb-1 dark:border-zinc-800">Employee Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input disabled={isLoading} {...register("employee.name")} />
            {errors.employee?.name && <p className="text-xs text-red-500">{errors.employee.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" disabled={isLoading} {...register("employee.email")} />
            {errors.employee?.email && <p className="text-xs text-red-500">{errors.employee.email.message}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 border-b pb-1 dark:border-zinc-800">Employment Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Position</Label>
            <Input disabled={isLoading} {...register("employment.position")} />
            {errors.employment?.position && <p className="text-xs text-red-500">{errors.employment.position.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Joining Date</Label>
            <Input type="date" disabled={isLoading} {...register("employment.joiningDate")} />
            {errors.employment?.joiningDate && <p className="text-xs text-red-500">{errors.employment.joiningDate.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Salary</Label>
            <Input type="number" disabled={isLoading} {...register("employment.salary")} />
            {errors.employment?.salary && <p className="text-xs text-red-500">{errors.employment.salary.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Input disabled={isLoading} {...register("employment.currency")} />
            {errors.employment?.currency && <p className="text-xs text-red-500">{errors.employment.currency.message}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Offer Content</Label>
        <textarea
          disabled={isLoading}
          {...register("offerContent")}
          className="flex min-h-[120px] w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
          placeholder="Enter offer content..."
        />
        {errors.offerContent && <p className="text-xs text-red-500">{errors.offerContent.message}</p>}
      </div>
      
      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (initialData ? "Updating..." : "Creating...") : (initialData ? "Update Offer" : "Create Offer")}
        </Button>
      </div>
    </form>
  );
}
