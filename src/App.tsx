import { useEffect, useState } from "react";
import {
  seedExchanges,
  seedOrders,
  type CartMap,
  type Exchange,
  type Order,
} from "./data";
import { ToastProvider, useLS } from "./ui";
import { Shop } from "./Shop";
import { Orders } from "./Orders";
import { ExchangeDesk } from "./Exchange";
import { Fees } from "./Fees";
import { ProductPage } from "./ProductPage";
import { CategoryPage } from "./CategoryPage";
import {
  IcBox,
  IcLogo,
  IcReceipt,
  IcScooter,
  IcSwap,
  IcTruck,
} from "./icons";

/* ------------------------------ routing ------------------------------ */

type Route =
  | { view: "shop" }
  | { view: "orders" }
  | { view: "exchange" }
  | { view: "fees" }
  | { view: "product"; id: string }
  | { view: "category"; slug: string };

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, "");
  const [a, b] = h.split("/");
  if (a === "product" && b) return { view: "product", id: decodeURIComponent(b) };
  if (a === "category" && b) return { view: "category", slug: decodeURIComponent(b) };
  if (a === "orders") return { view: "orders" };
  if (a === "exchange") return { view: "exchange" };
  if (a === "fees") return { view: "fees" };
  return { view: "shop" };
}

const routeKey = (r: Route) =>
  r.view === "product"
    ? `product:${r.id}`
    : r.view === "category"
      ? `category:${r.slug}`
      : r.view;

const TICKER = [
  "Rider update · BB-10490 crossed Airport Road — 40 min out",
  "Same-day cutoff 12:00 PM sharp · inside Dhaka only",
  "Exchange fee · ৳50 inside Dhaka · ৳90 outside",
  "Prepay the delivery fee → straight to the priority queue",
  "Same-day ৳120 · prepaid only · at your door tonight 6–10 PM",
  "Cash on delivery accepted on every standard order",
  "New · every category has its own landing page now",
];

/* --------------------- ambient delivery-route layer --------------------- */

function RouteBackdrop() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-[0.14]"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <path
        id="rt1"
        d="M-80 190 C 260 80, 520 340, 860 240 S 1380 110, 1560 250"
        fill="none"
        stroke="#0c3b2e"
        strokeWidth="2.5"
        strokeDasharray="10 14"
        className="route-dash"
      />
      <path
        id="rt2"
        d="M-60 710 C 300 620, 540 830, 900 730 S 1360 640, 1540 770"
        fill="none"
        stroke="#0c3b2e"
        strokeWidth="2.5"
        strokeDasharray="4 12"
        className="route-dash"
        style={{ animationDuration: "38s" }}
      />
      <g fill="#0c3b2e">
        <g>
          <rect x="-9" y="-13" width="18" height="10" rx="2.5" />
          <circle cx="-5" cy="0" r="3.4" />
          <circle cx="6" cy="0" r="3.4" />
          <animateMotion dur="42s" repeatCount="indefinite">
            <mpath href="#rt1" />
          </animateMotion>
        </g>
        <g opacity="0.7">
          <circle r="4.5" />
          <animateMotion dur="58s" repeatCount="indefinite">
            <mpath href="#rt2" />
          </animateMotion>
        </g>
      </g>
    </svg>
  );
}

/* --------------------------------- nav --------------------------------- */

function TabLink({
  label,
  icon: Icon,
  badge,
  active,
  href,
}: {
  label: string;
  icon: (p: { className?: string }) => React.ReactElement;
  badge?: number;
  active: boolean;
  href: string;
}) {
  return (
    <a
      href={href}
      className={`relative flex shrink-0 items-center gap-2 rounded-lg border-2 px-3.5 py-2 text-sm font-bold transition ${
        active
          ? "border-ink bg-sun text-ink shadow-[2px_2px_0_0_var(--color-ink)]"
          : "border-transparent text-[#e9f2e2]/80 hover:bg-pine2 hover:text-[#e9f2e2]"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="mono grid h-4.5 min-w-4.5 place-items-center rounded-full border border-ink bg-tang px-1 text-[10px] font-bold text-[#fdf6ee]">
          {badge}
        </span>
      )}
    </a>
  );
}

/* --------------------------------- shell --------------------------------- */

function Shell() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [orders, setOrders] = useLS<Order[]>("bz.orders", seedOrders);
  const [exchanges, setExchanges] = useLS<Exchange[]>("bz.exchanges", seedExchanges);
  const [cart, setCart] = useLS<CartMap>("bz.cart", {});
  const [presetOrder, setPresetOrder] = useState<string | null>(null);
  const [cartPing, setCartPing] = useState(0);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const key = routeKey(route);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [key]);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const addOrder = (o: Order) => setOrders((l) => [o, ...l]);
  const addExchange = (e: Exchange) => setExchanges((l) => [e, ...l]);

  const openBag = () => {
    setCartPing((p) => p + 1);
    window.location.hash = "#/shop";
  };

  const tabs = [
    { id: "shop", label: "Shop", icon: IcBox, href: "#/" },
    { id: "orders", label: "My Orders", icon: IcReceipt, href: "#/orders", badge: orders.length },
    { id: "exchange", label: "Exchange Desk", icon: IcSwap, href: "#/exchange", badge: exchanges.length },
    { id: "fees", label: "Delivery Fees", icon: IcTruck, href: "#/fees" },
  ] as const;

  const activeTab =
    route.view === "product" || route.view === "category" ? "shop" : route.view;

  return (
    <div className="relative min-h-screen">
      <RouteBackdrop />

      {/* sticky masthead */}
      <div className="sticky top-0 z-50">
        <div aria-hidden className="overflow-hidden bg-ink py-1.5 text-sun">
          <div className="ticker-track">
            {[0, 1].map((d) => (
              <div
                key={d}
                className="mono flex shrink-0 items-center gap-8 pr-8 text-[11px] font-semibold uppercase tracking-[0.14em]"
              >
                {TICKER.map((t, i) => (
                  <span key={i} className="flex items-center gap-8">
                    <span>{t}</span>
                    <span className="inline-block h-1.5 w-1.5 rotate-45 bg-tang" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <header className="border-b-2 border-ink bg-pine text-[#e9f2e2]">
          <div className="mx-auto w-full max-w-7xl px-4">
            <div className="flex h-16 items-center justify-between gap-4">
              <a href="#/" className="flex items-center gap-2.5 transition hover:opacity-85">
                <IcLogo className="h-9 w-9" />
                <span className="text-left">
                  <span className="font-display block text-xl font-extrabold leading-none tracking-tight">
                    BazarBox
                  </span>
                  <span className="mono mt-1 block text-[8.5px] font-semibold uppercase tracking-[0.3em] text-sun">
                    Dhaka order desk
                  </span>
                </span>
              </a>

              <nav className="hidden items-center gap-1 lg:flex">
                {tabs.map((t) => (
                  <TabLink
                    key={t.id}
                    label={t.label}
                    icon={t.icon}
                    badge={"badge" in t ? t.badge : undefined}
                    active={activeTab === t.id}
                    href={t.href}
                  />
                ))}
              </nav>

              <button onClick={openBag} className="btn btn-sun btn-sm">
                <IcBox className="h-4 w-4" />
                Bag
                <span className="mono grid h-5 min-w-5 place-items-center rounded-full border-2 border-ink bg-tang px-1 text-[11px] font-bold text-[#fdf6ee]">
                  {cartCount}
                </span>
              </button>
            </div>

            <nav className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto pb-2.5 lg:hidden">
              {tabs.map((t) => (
                <TabLink
                  key={t.id}
                  label={t.label}
                  icon={t.icon}
                  badge={"badge" in t ? t.badge : undefined}
                  active={activeTab === t.id}
                  href={t.href}
                />
              ))}
            </nav>
          </div>
        </header>
      </div>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20">
        <div key={key} className="anim-fadeup">
          {route.view === "shop" && (
            <Shop
              cart={cart}
              setCart={setCart}
              addOrder={addOrder}
              onFees={() => {
                window.location.hash = "#/fees";
              }}
              cartPing={cartPing}
            />
          )}
          {route.view === "orders" && (
            <Orders
              orders={orders}
              onExchange={(id) => {
                setPresetOrder(id);
                window.location.hash = "#/exchange";
              }}
            />
          )}
          {route.view === "exchange" && (
            <ExchangeDesk
              orders={orders}
              exchanges={exchanges}
              addExchange={addExchange}
              presetOrderId={presetOrder}
              onPresetConsumed={() => setPresetOrder(null)}
            />
          )}
          {route.view === "fees" && <Fees />}
          {route.view === "product" && (
            <ProductPage
              id={route.id}
              cart={cart}
              setCart={setCart}
              onAddedToBag={() => {
                setCartPing((p) => p + 1);
                window.location.hash = "#/shop";
              }}
            />
          )}
          {route.view === "category" && (
            <CategoryPage slug={route.slug} cart={cart} setCart={setCart} />
          )}
        </div>
      </main>

      {/* floating bag outside the shop view */}
      {route.view !== "shop" && (
        <button onClick={openBag} className="btn btn-sun fixed bottom-5 left-5 z-[60]" aria-label="Open bag">
          <IcBox className="h-4.5 w-4.5" />
          Bag
          <span className="mono grid h-5 min-w-5 place-items-center rounded-full border-2 border-ink bg-tang px-1 text-[11px] font-bold text-[#fdf6ee]">
            {cartCount}
          </span>
        </button>
      )}

      <footer className="relative z-10 border-t-2 border-ink bg-pine text-[#e9f2e2]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <IcLogo className="h-9 w-9" />
              <span className="font-display text-xl font-extrabold tracking-tight">BazarBox</span>
            </div>
            <p className="mt-3 max-w-xs text-sm font-medium leading-relaxed text-[#e9f2e2]/70">
              A small Dhaka shop with its own riders, a noon cutoff, an exchange
              desk that asks for exactly one photo of the problem — and a
              landing page for every aisle.
            </p>
            <p className="mono mt-4 flex items-center gap-2 text-sm font-bold text-sun">
              <IcScooter className="h-4.5 w-4.5" />
              Hotline · 09612-BZBOX24
            </p>
          </div>

          <div>
            <p className="overline text-sun">Fees at a glance</p>
            <ul className="mono mt-3.5 space-y-2 text-[13px] font-semibold">
              <li className="flex justify-between gap-4 border-b border-pine2 pb-2">
                <span className="text-[#e9f2e2]/70">Standard · inside Dhaka</span>
                <span>৳60</span>
              </li>
              <li className="flex justify-between gap-4 border-b border-pine2 pb-2">
                <span className="text-[#e9f2e2]/70">Standard · outside Dhaka</span>
                <span>৳130</span>
              </li>
              <li className="flex justify-between gap-4 border-b border-pine2 pb-2">
                <span className="text-[#e9f2e2]/70">Same-day · before 12 PM · prepaid</span>
                <span>৳120</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-[#e9f2e2]/70">Exchange · inside / outside</span>
                <span>৳50 / ৳90</span>
              </li>
            </ul>
          </div>

          <div>
            <p className="overline text-sun">Desk hours</p>
            <ul className="mt-3.5 space-y-1.5 text-sm font-semibold text-[#e9f2e2]/80">
              <li>Sat – Thu · 9:00 AM – 10:00 PM</li>
              <li>Friday · 3:00 PM – 10:00 PM</li>
              <li className="text-[#e9f2e2]/55">Same-day cutoff · 12:00 PM daily</li>
            </ul>
            <p className="overline mt-5 text-sun">Pay the fee with</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {[
                ["bKash", "#d12053"],
                ["Nagad", "#f6921e"],
                ["Rocket", "#8c3494"],
                ["VISA", "#235789"],
              ].map(([n, c]) => (
                <span
                  key={n}
                  className="mono rounded-md border-2 border-ink px-2 py-1 text-[10px] font-bold text-[#fdf6ee]"
                  style={{ background: c }}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-pine2">
          <div className="mono mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-[10px] uppercase tracking-wider text-[#e9f2e2]/45">
            <span>© 2026 BazarBox · Dhaka, Bangladesh</span>
            <span>Riders get chai breaks — it&rsquo;s in the contract</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}
