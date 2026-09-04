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
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <a
                href="https://www.facebook.com/deencommerce"
                target="_blank"
                rel="noopener"
                title="Follow DEEN on Facebook"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "#1877F2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                f
              </a>
              <a
                href="https://www.instagram.com/deencommerce"
                target="_blank"
                rel="noopener"
                title="Follow DEEN on Instagram"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                📸
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
