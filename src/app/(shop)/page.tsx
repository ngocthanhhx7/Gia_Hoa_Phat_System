import Link from "next/link";
import { ChefHat, Truck, Shield, Star } from "lucide-react";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-amber-600 via-amber-500 to-orange-400 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <ChefHat className="w-8 h-8" />
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                Gia Hòa Phát
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
              Nguyên liệu & Thiết bị
              <br />
              <span className="text-amber-100">Làm Bánh Chất Lượng</span>
            </h1>
            <p className="text-lg text-amber-100 mb-8 max-w-lg">
              Đồng hành cùng đam mê làm bánh của bạn với hàng ngàn sản phẩm
              chính hãng, giá tốt nhất thị trường.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="px-6 py-3 bg-white text-amber-700 font-semibold rounded-xl hover:bg-amber-50 transition shadow-lg shadow-amber-900/20"
              >
                Xem sản phẩm
              </Link>
              <Link
                href="/register"
                className="px-6 py-3 border-2 border-white/40 text-white font-semibold rounded-xl hover:bg-white/10 transition"
              >
                Đăng ký ngay
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Star,
              title: "Sản phẩm chính hãng",
              desc: "100% nguyên liệu và thiết bị làm bánh đạt tiêu chuẩn chất lượng.",
            },
            {
              icon: Truck,
              title: "Giao hàng nhanh",
              desc: "Đặt hàng nhanh chóng, giao hàng tận nơi trên toàn quốc.",
            },
            {
              icon: Shield,
              title: "Thanh toán an toàn",
              desc: "Hỗ trợ đa dạng phương thức thanh toán, bảo mật tuyệt đối.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                {title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">
            Bắt đầu mua sắm ngay hôm nay
          </h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Tạo tài khoản miễn phí và khám phá hàng ngàn sản phẩm làm bánh chất
            lượng cao.
          </p>
          <Link
            href="/products"
            className="inline-block px-8 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition shadow-sm"
          >
            Khám phá sản phẩm →
          </Link>
        </div>
      </section>
    </div>
  );
}
