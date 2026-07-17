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

const schema = z.object({
  name: z.string().min(1, "Company name is required"),
});

type FormValues = z.infer<typeof schema>;

export function CompanyForm({ onSuccess, initialData }: { onSuccess: () => void, initialData?: any }) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? { name: initialData.name } : undefined,
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
      
      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (initialData ? "Updating..." : "Creating...") : (initialData ? "Update Company" : "Create Company")}
        </Button>
      </div>
    </form>
  );
}
