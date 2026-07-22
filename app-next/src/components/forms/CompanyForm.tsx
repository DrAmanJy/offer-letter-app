"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ICompanyDTO } from "@/types/company";

const schema = z.object({
  name: z.string().min(1, "Company name is required"),
  defaultOfferTemplate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CompanyForm({ onSuccess, onCancel, initialData }: { onSuccess: () => void, onCancel: () => void, initialData?: ICompanyDTO }) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? { name: initialData.name, defaultOfferTemplate: initialData.defaultOfferTemplate || "" } : undefined,
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (initialData?._id) {
        const response = await axios.put(`/api/v1/companies/${initialData._id}`, data);
        if (response.data?.success) {
          toast.success("Company updated successfully");
          onSuccess();
        }
      } else {
        const response = await axios.post("/api/v1/companies", data);
        if (response.data?.success) {
          toast.success("Company created successfully");
          onSuccess();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${initialData ? 'update' : 'create'} company`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Company Name</Label>
        <Input
          id="name"
          placeholder="e.g. Acme Corp"
          disabled={isLoading}
          {...register("name")}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultOfferTemplate">Default Offer Template (Optional)</Label>
        <textarea
          id="defaultOfferTemplate"
          placeholder="Enter default template text for this company..."
          disabled={isLoading}
          {...register("defaultOfferTemplate")}
          className="flex min-h-[120px] w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300"
        />
      </div>
      
      <div className="pt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
