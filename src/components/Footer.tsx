import { ChefHat } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 text-white mb-3">
              <ChefHat className="w-6 h-6 text-amber-400" />
              <span className="text-lg font-bold">Gia Hòa Phát</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Chuyên cung cấp nguyên liệu và thiết bị làm bánh chất lượng cao.
              Đồng hành cùng bạn trên mọi hành trình làm bánh.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
              Liên kết
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="hover:text-amber-400 transition">
                  Sản phẩm
                </Link>
              </li>
              <li>
                <Link href="/products?type=ingredient" className="hover:text-amber-400 transition">
                  Nguyên liệu
                </Link>
              </li>
              <li>
                <Link href="/products?type=equipment" className="hover:text-amber-400 transition">
                  Thiết bị
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
              Liên hệ
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>📍 TP. Hồ Chí Minh, Việt Nam</li>
              <li>📞 0901 234 567</li>
              <li>✉️ contact@giahoapat.vn</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Gia Hòa Phát. Tất cả quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
}
