import Link from "next/link";
import { fetchOutlets, fetchAppSettings } from "@/lib/api";

export default async function Footer() {
  const [outlets, settings] = await Promise.all([fetchOutlets(), fetchAppSettings()]);
  const whatsapp = settings?.contact?.whatsapp || "01952-700500";
  const waDigits = whatsapp.replace(/[^0-9]/g, "");
  const hotline = settings?.contact?.hotline || "09617-700500";
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          {/* Brand */}
          <div>
            <div className="footer__brand-name" style={{ marginBottom: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo_white.png"
                alt="DEEN - দেশের প্রথম ডেনিম ব্র্যান্ড"
                style={{
                  height: 34,
                  width: "auto",
                  objectFit: "contain",
                }}
              />
            </div>
            <p className="footer__tagline">
              <strong>দেশের প্রথম ডেনিম ব্র্যান্ড</strong> — artisanal selvedge denim,
              combed cotton tailoring, and contemporary menswear crafted with pride in Bangladesh.
            </p>
            <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
              <a
                href="https://www.facebook.com/deencommerce"
                target="_blank"
                rel="noopener"
                title="Follow DEEN on Facebook"
                aria-label="DEEN Facebook"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#1877F2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  textDecoration: "none",
                  transition: "transform 0.15s ease",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/deencommerce/?hl=en"
                target="_blank"
                rel="noopener"
                title="Follow DEEN on Instagram"
                aria-label="DEEN Instagram"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  textDecoration: "none",
                  transition: "transform 0.15s ease",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/deencommerce"
                target="_blank"
                rel="noopener"
                title="Connect with DEEN on LinkedIn"
                aria-label="DEEN LinkedIn"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#0A66C2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  textDecoration: "none",
                  transition: "transform 0.15s ease",
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a
                href={`https://wa.me/88${waDigits}`}
                target="_blank"
                rel="noopener"
                title="WhatsApp Stylist Hotline"
                aria-label="DEEN WhatsApp"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#25D366",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  textDecoration: "none",
                  transition: "transform 0.15s ease",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <p className="footer__col-title">Collections</p>
            <ul className="footer__links">
              {[
                { label: "Denim & Jeans", href: "/shop?category=JEANS" },
                { label: "Casual & Formal Shirts", href: "/shop?category=SHIRT" },
                { label: "Heritage Panjabi", href: "/shop?category=PANJABI" },
                { label: "240 GSM T-Shirts", href: "/shop?category=T-SHIRT" },
                { label: "Cargo & Trousers", href: "/shop?category=TROUSERS" },
                { label: "DEEN Select ⚡", href: "/shop?segment=select" },
                { label: "Sale & Offers 🔥", href: "/shop?sort=sale" },
              ].map((c) => (
                <li key={c.label}>
                  <Link href={c.href}>{c.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shopping Policies */}
          <div>
            <p className="footer__col-title">Shopping Policies</p>
            <ul className="footer__links">
              <li><Link href="/orders">Track My Order (Pathao)</Link></li>
              <li><Link href="/orders#returns">Exchange &amp; Refund Policy</Link></li>
              <li><Link href="/cart#delivery">Doorstep Delivery Policy</Link></li>
              <li><Link href="/shop#size-guide">Official Size Guide</Link></li>
              <li><Link href="/profile">My Account</Link></li>
            </ul>
          </div>

          {/* Customer Service & Outlets */}
          <div>
            <p className="footer__col-title">Customer Service</p>
            <ul className="footer__links">
              <li style={{ color: "var(--sub)", fontSize: 13, lineHeight: 1.5 }}>
                📍 <strong>Headquarters:</strong> Dhaka, Bangladesh<br />
                <span style={{ fontSize: 11, color: "var(--brand)" }}>
                  Online Store · Nationwide Delivery Across 64 Districts
                </span>
              </li>
              <li style={{ marginTop: 8 }}>
                <a href={`tel:+88${waDigits}`} style={{ fontSize: 13, fontWeight: 700 }}>
                  📞 Hotline: +880 {whatsapp}
                </a>
              </li>
              <li>
                <a href={`mailto:${settings?.contact?.email || "support@deencommerce.com"}`} style={{ fontSize: 13 }}>
                  ✉️ {settings?.contact?.email || "support@deencommerce.com"}
                </a>
              </li>
            </ul>
            <div style={{ marginTop: 12 }}>
              <p className="footer__col-title">Online Concierge Hours</p>
              <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.5 }}>
                Everyday: 10:00 AM – 10:00 PM<br />
                Doorstep Delivery &amp; 7-Day Size Exchange
              </p>
            </div>
          </div>
        </div>

        {/* Payment Partners Trust Banner */}
        <div
          style={{
            textAlign: "center",
            padding: "24px 0 16px",
            borderTop: "1px solid var(--border)",
            marginTop: 24,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/paywith_web_versionW.png"
            alt="Payment Methods: bKash, Nagad, Rocket, Visa, Mastercard, AMEX, Cash on Delivery"
            style={{
              maxHeight: 32,
              maxWidth: "100%",
              height: "auto",
              objectFit: "contain",
              opacity: 0.9,
            }}
          />
        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} DEEN Commerce. All rights reserved.</span>
          <span>Made with ❤️ in Bangladesh</span>
        </div>
      </div>
    </footer>
  );
}
