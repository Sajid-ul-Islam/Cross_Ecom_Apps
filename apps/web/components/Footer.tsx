import Link from "next/link";

export default function Footer() {
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
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <a
                href="https://www.facebook.com/deencommerce"
                target="_blank"
                rel="noopener"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--sub)",
                }}
              >
                f
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
              <li><a href="#">Size Guide</a></li>
              <li><a href="#">Return Policy</a></li>
              <li><a href="#">Delivery Info</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="footer__col-title">Contact</p>
            <ul className="footer__links">
              <li style={{ color: "var(--sub)", fontSize: 13 }}>
                📍 Plot 68, Kemal Ataturk Ave,<br />Banani, Dhaka 1213
              </li>
              <li style={{ marginTop: 8 }}>
                <a href="tel:+8801877076200" style={{ fontSize: 13 }}>
                  📞 +880 1877-076200
                </a>
              </li>
              <li>
                <a href="mailto:support@deencommerce.com" style={{ fontSize: 13 }}>
                  ✉️ support@deencommerce.com
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
