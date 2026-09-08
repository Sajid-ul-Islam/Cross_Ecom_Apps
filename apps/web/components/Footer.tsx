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
                src="/logo.png"
                alt="DEEN Commerce"
                style={{
                  height: 32,
                  width: "auto",
                  objectFit: "contain",
                  filter: "invert(1) brightness(1.2)",
                }}
              />
            </div>
            <p className="footer__tagline">
              Crafted for the modern Bangladeshi man — premium fabrics, honest
              pricing, delivered to your door.
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
            <p className="footer__col-title">Shop</p>
            <ul className="footer__links">
              {["JEANS", "SHIRT", "PANJABI", "T-SHIRT", "TROUSERS", "ACCESSORIES"].map((c) => (
                <li key={c}>
                  <Link href={`/shop?category=${c}`}>{c.charAt(0) + c.slice(1).toLowerCase()}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <p className="footer__col-title">Information</p>
            <ul className="footer__links">
              <li><Link href="/shop">All Products</Link></li>
              <li><Link href="/shop#size-guide">Size Guide</Link></li>
              <li><Link href="/orders#returns">Return Policy</Link></li>
              <li><Link href="/cart#delivery">Delivery Info</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="footer__col-title">Contact</p>
            <ul className="footer__links">
              <li style={{ color: "var(--sub)", fontSize: 13 }}>
                📍 {outlets.length > 0 ? outlets[0].address : 'Ramzannesa Super Market, Mirpur 12, Dhaka 1216'}<br />
                <span style={{ fontSize: 11, color: "var(--brand)" }}>Outlets: {outlets.map(o => o.name.replace('DEEN ', '').replace(' Outlet', '').replace(' (Flagship Outlet)', '')).join(' · ') || 'Mirpur 12 · Wari · Cumilla · Sylhet'}</span>
              </li>
              <li style={{ marginTop: 8 }}>
                <a href={`tel:+88${waDigits}`} style={{ fontSize: 13 }}>
                  📞 +880 {whatsapp}
                </a>
              </li>
              <li>
                <a href={`mailto:${settings?.contact?.email || 'support@deencommerce.com'}`} style={{ fontSize: 13 }}>
                  ✉️ {settings?.contact?.email || 'support@deencommerce.com'}
                </a>
              </li>
            </ul>
            <div style={{ marginTop: 14 }}>
              <p className="footer__col-title">Hours</p>
              <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.6 }}>
                Sat–Thu: 10am – 10pm<br />
                Fri: 2pm – 10pm
              </p>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} DEEN Commerce. All rights reserved.</span>
          <span>Made with ❤️ in Bangladesh</span>
        </div>
      </div>
    </footer>
  );
}
