"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "react-hot-toast";
import { KeyRound, Mail, User, Shield, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { CustomSelect } from "@/components/ui/Select";
import { IUserDTO } from "@/types/user";

const schema = z.object({
  username: z.string().min(1, "Username is required"),
  name: z.string().min(1, "Full name is required"),
  password: z.string().optional(),
  role: z.enum(['ADMIN', 'HR', 'VIEWER']),
});

type FormValues = z.infer<typeof schema>;

interface UserFormProps {
  initialData?: IUserDTO;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserForm({ initialData, onSuccess, onCancel }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: initialData?.username || "",
      name: initialData?.name || "",
      password: "",
      role: initialData?.role || "HR",
    },
  });

  const roleValue = watch("role");

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue("password", pass, { shouldValidate: true });
    toast.success("Generated secure password!");
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (initialData?._id) {
        if (!data.password) delete data.password;
        const response = await axios.patch(`/api/v1/users/${initialData._id}`, data);
        if (response.data?.success) {
          toast.success("User updated successfully");
          onSuccess();
        }
      } else {
        if (!data.password) data.password = 'Pass@123456';
        const response = await axios.post("/api/v1/users", data);
        if (response.data?.success) {
          toast.success("User created successfully");
          onSuccess();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="username" className="text-xs font-semibold">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              id="username"
              placeholder="e.g. johndoe"
              disabled={isLoading}
              {...register("username")}
              className={`pl-9 ${errors.username ? "border-red-500" : ""}`}
            />
          </div>
          {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-semibold">Full Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            disabled={isLoading}
            {...register("name")}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="role" className="text-xs font-semibold">Account Role</Label>
          <CustomSelect
            options={[
              { value: 'ADMIN', label: 'Admin (Full Privileges)' },
              { value: 'HR', label: 'HR Manager' }
            ]}
            value={roleValue}
            onChange={(val) => setValue("role", val as any)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-xs font-semibold">
            Password {initialData && "(Leave blank to keep unchanged)"}
          </Label>
          <button
            type="button"
            onClick={generateRandomPassword}
            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3" /> Auto-Generate
          </button>
        </div>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            id="password"
            type="text"
            placeholder={initialData ? "••••••••" : "Enter password"}
            disabled={isLoading}
            {...register("password")}
            className={`pl-9 ${errors.password ? "border-red-500" : ""}`}
          />
        </div>
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white">
          {isLoading ? "Saving..." : initialData ? "Update User" : "Create User"}
        </Button>
      </div>
    </form>
  );
}

