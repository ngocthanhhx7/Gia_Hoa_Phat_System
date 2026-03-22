"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validators";
import { MESSAGES } from "@/lib/constants";
import { Loader2, Save, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";

interface ProfileData {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/profile")
        .then((r) => r.json())
        .then(({ user }) => {
          setProfile(user);
          reset({
            fullName: user.fullName,
            phone: user.phone || "",
            address: user.address || "",
          });
        })
        .finally(() => setLoading(false));
    }
  }, [status, router, reset]);

  async function onSubmit(data: UpdateProfileInput) {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error);
      return;
    }
    toast.success(json.message || MESSAGES.MSG13);
    setProfile((prev) => (prev ? { ...prev, ...json.user } : prev));
  }

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!session || !profile) return null;

  const roleLabel =
    profile.role === "ADMIN"
      ? "Quản trị viên"
      : profile.role === "VENDOR"
      ? "Nhà cung cấp"
      : "Khách hàng";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <UserIcon className="w-8 h-8 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {profile.fullName}
          </h1>
          <p className="text-sm text-slate-500">
            {profile.email} • {roleLabel}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">
          Thông tin cá nhân
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email - Read only */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Email
            </label>
            <input
              value={profile.email}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Họ và tên
            </label>
            <input
              {...register("fullName")}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
            />
            {errors.fullName && (
              <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Số điện thoại
            </label>
            <input
              {...register("phone")}
              type="tel"
              placeholder="0901234567"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Địa chỉ
            </label>
            <textarea
              {...register("address")}
              rows={3}
              placeholder="Nhập địa chỉ giao hàng mặc định"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition resize-none"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
