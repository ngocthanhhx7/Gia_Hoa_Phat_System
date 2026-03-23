"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  TicketPercent,
  Loader2,
  Edit2,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { formatVND } from "@/lib/constants";

type Voucher = {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  active: boolean;
};

const emptyForm = {
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "10",
  minOrderValue: "0",
  maxUses: "0",
  startDate: "",
  endDate: "",
  active: true,
};

function toDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/vouchers?${params}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể tải voucher");
        return;
      }

      setVouchers(data.vouchers || []);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const stats = useMemo(() => {
    const active = vouchers.filter((voucher) => voucher.active).length;
    const expired = vouchers.filter((voucher) => new Date(voucher.endDate) < new Date()).length;
    return { active, expired, total: vouchers.length };
  }, [vouchers]);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
    setModalOpen(true);
  }

  function openEdit(voucher: Voucher) {
    setEditingId(voucher.id);
    setForm({
      code: voucher.code,
      description: voucher.description || "",
      discountType: voucher.discountType,
      discountValue: String(voucher.discountValue),
      minOrderValue: String(voucher.minOrderValue),
      maxUses: String(voucher.maxUses),
      startDate: toDateInput(voucher.startDate),
      endDate: toDateInput(voucher.endDate),
      active: voucher.active,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/admin/vouchers/${editingId}` : "/api/admin/vouchers";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          code: form.code.toUpperCase().trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể lưu voucher");
        return;
      }

      toast.success(editingId ? "Đã cập nhật voucher" : "Đã tạo voucher mới");
      setModalOpen(false);
      await fetchVouchers();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Xóa voucher ${code}?`)) return;

    const res = await fetch(`/api/admin/vouchers/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Không thể xóa voucher");
      return;
    }

    toast.success("Đã xóa voucher");
    await fetchVouchers();
  }

  return (
    <div>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý voucher</h1>
          <p className="text-sm text-slate-500">Tạo mã giảm giá, chỉnh hạn dùng và theo dõi lượt sử dụng.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tạo voucher
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-sm text-slate-500">Tổng voucher</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-sm text-slate-500">Đang hoạt động</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-sm text-slate-500">Đã hết hạn</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{stats.expired}</p>
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo mã hoặc mô tả"
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          </div>
        ) : vouchers.length === 0 ? (
          <div className="py-20 text-center">
            <TicketPercent className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Chưa có voucher nào</p>
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-slate-100">
              {vouchers.map((voucher) => (
                <div key={voucher.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{voucher.code}</p>
                      <p className="text-sm text-slate-500 mt-1">{voucher.description || "Không có mô tả"}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${voucher.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {voucher.active ? "Hoạt động" : "Ẩn"}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 space-y-1">
                    <p>
                      Giảm: {voucher.discountType === "PERCENTAGE" ? `${voucher.discountValue}%` : formatVND(voucher.discountValue)}
                    </p>
                    <p>Tối thiểu: {formatVND(voucher.minOrderValue)}</p>
                    <p>Lượt dùng: {voucher.usedCount} / {voucher.maxUses === 0 ? "∞" : voucher.maxUses}</p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(voucher)}
                      title="Sửa voucher"
                      aria-label="Sửa voucher"
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(voucher.id, voucher.code)}
                      title="Xóa voucher"
                      aria-label="Xóa voucher"
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Mã</th>
                    <th className="px-4 py-3">Giảm giá</th>
                    <th className="px-4 py-3">Điều kiện</th>
                    <th className="px-4 py-3">Hiệu lực</th>
                    <th className="px-4 py-3">Sử dụng</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vouchers.map((voucher) => (
                    <tr key={voucher.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{voucher.code}</p>
                        <p className="text-xs text-slate-400 mt-1">{voucher.description || "Không có mô tả"}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {voucher.discountType === "PERCENTAGE"
                          ? `${voucher.discountValue}%`
                          : formatVND(voucher.discountValue)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        Đơn từ {formatVND(voucher.minOrderValue)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {toDateInput(voucher.startDate)} - {toDateInput(voucher.endDate)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {voucher.usedCount} / {voucher.maxUses === 0 ? "∞" : voucher.maxUses}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${voucher.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {voucher.active ? "Hoạt động" : "Ẩn"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(voucher)}
                            title="Sửa voucher"
                            aria-label="Sửa voucher"
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(voucher.id, voucher.code)}
                            title="Xóa voucher"
                            aria-label="Xóa voucher"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? "Cập nhật voucher" : "Tạo voucher mới"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                title="Đóng hộp thoại"
                aria-label="Đóng hộp thoại"
                className="p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Mã voucher *</label>
                <input
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase"
                  placeholder="WELCOME10"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Mô tả</label>
                <input
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="Giảm 10% cho khách mới"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Loại giảm giá</label>
                  <select
                    title="Chọn loại giảm giá"
                    value={form.discountType}
                    onChange={(event) => setForm({ ...form, discountType: event.target.value as "PERCENTAGE" | "FIXED" })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="PERCENTAGE">Phần trăm</option>
                    <option value="FIXED">Giá trị cố định</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Giá trị *</label>
                  <input
                    type="number"
                    title="Giá trị giảm giá"
                    value={form.discountValue}
                    onChange={(event) => setForm({ ...form, discountValue: event.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Đơn tối thiểu</label>
                  <input
                    type="number"
                    title="Đơn hàng tối thiểu"
                    value={form.minOrderValue}
                    onChange={(event) => setForm({ ...form, minOrderValue: event.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Số lượt tối đa</label>
                  <input
                    type="number"
                    title="Số lượt sử dụng tối đa"
                    value={form.maxUses}
                    onChange={(event) => setForm({ ...form, maxUses: event.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    title="Ngày bắt đầu voucher"
                    value={form.startDate}
                    onChange={(event) => setForm({ ...form, startDate: event.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    title="Ngày kết thúc voucher"
                    value={form.endDate}
                    onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => setForm({ ...form, active: event.target.checked })}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-slate-600">Kích hoạt voucher</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition">
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.code || !form.discountValue || !form.startDate || !form.endDate}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 disabled:opacity-50 transition shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingId ? "Cập nhật" : "Tạo voucher"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
