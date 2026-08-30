Yes — **absolutely**. In your current architecture, you can implement **Google and Facebook sign-up/sign-in at the mobile + web frontend/gateway layer without modifying WordPress authentication itself**.

The key is to distinguish between:

1. **Identity authentication** — Google/Facebook verifies who the customer is.
2. **WooCommerce customer account** — WordPress/WooCommerce needs a corresponding customer record if you want the user to have a normal WooCommerce account.

Your Fastify gateway is the perfect place to bridge those two.

### Recommended architecture

```text
                 Google / Facebook
                        │
                 OAuth / OIDC
                        │
                        ▼
              ┌──────────────────┐
              │  Fastify Gateway │
              │    apps/api      │
              └────────┬─────────┘
                       │
              Verify provider token
                       │
                       ▼
              Your Customer Identity
                       │
             ┌─────────┴─────────┐
             │                   │
        Existing user       New customer
             │                   │
             ▼                   ▼
       Login/session       Create/link identity
             │                   │
             └─────────┬─────────┘
                       ▼
                Mobile / Web
```

You **don't need to replace WordPress's `wp-login.php` authentication**.

### But there's an important catch

If you mean:

> "Can Google/Facebook users sign in to my app, place WooCommerce orders, see their orders, etc., while WordPress remains completely untouched?"

**Yes, technically.**

But you'll need to decide where the customer identity lives.

I would recommend:

```text
Google/Facebook
       ↓
Fastify Auth
       ↓
Customer identity database
       ↓
Fastify session
       ↓
WooCommerce
```

rather than trying to force Google/Facebook credentials into WordPress.

For example:

```text
Customer
├── internal_id: cust_123
├── provider: google
├── provider_user_id: xxx
├── email: customer@gmail.com
├── name: ...
└── phone: 017xxxxxxxx
```

Then your gateway issues its own session:

```text
Authorization: Bearer <gateway-session>
```

Your existing mobile/web architecture already has a centralized gateway and session layer, so this fits very naturally.

### What about WooCommerce orders?

This is where I'd be careful.

If Google/Facebook authentication is only for **your application identity**, WooCommerce doesn't necessarily know that identity.

You could have:

```text
Google account
     ↓
Fastify customer
     ↓
WooCommerce order
```

and associate orders using your internal customer ID / verified email / phone.

But if you want the user to have a **true WooCommerce customer account**, then eventually you probably want the gateway to create/link a corresponding WordPress customer.

That does **not necessarily mean modifying WordPress code**.

Your gateway could use the existing WooCommerce/WordPress APIs to create or associate the customer.

So there are two approaches:

| Approach                                |   Modify WP code? | Woo customer account? |
| --------------------------------------- | ----------------: | --------------------: |
| Gateway-only identity                   |              ❌ No |       Not necessarily |
| Gateway creates WP customer through API |              ❌ No |                 ✅ Yes |
| WordPress OAuth plugin/custom auth      |           Usually |                 ✅ Yes |
| Modify WP authentication code           | ❌ Not recommended |                     ✅ |

### For your project, I'd choose this

```text
                Google
                  │
                Facebook
                  │
                  ▼
          ┌───────────────┐
          │ Fastify Auth  │
          └───────┬───────┘
                  │
          ┌───────▼────────┐
          │ Customer Store  │
          │ / Identity DB   │
          └───────┬────────┘
                  │
          ┌───────▼────────┐
          │ Gateway Session │
          └───────┬────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
     Mobile                 Web
        │                   │
        └─────────┬─────────┘
                  ▼
             WooCommerce
```

This also gives you a clean path later to add:

* Google
* Facebook
* Apple
* phone OTP
* email/password

without making your frontend depend directly on WordPress authentication.

**One thing I would change from your current architecture:** don't keep authentication/session state in `auth_sessions.json` if you're moving toward social login and multiple gateway instances. Use a shared persistent store (Postgres/Supabase/Redis) for the identity/session layer.

If you want, I can next **design the exact Google + Facebook authentication architecture for your existing `apps/api`, `apps/mobile`, and `apps/web`**, including the routes, database schema, token flow, and what changes are needed in each app — while keeping WordPress untouched.
Yes — **that changes the recommendation**, and for your goal I would do it.

You want:

> **Google/Facebook → real WooCommerce customer account → real customer order**

while **not modifying WordPress/WooCommerce core code**.

That's possible, but there is an important distinction: **OAuth authentication and creating the WooCommerce customer are two separate steps.**

### Recommended flow for your project

```text
Google / Facebook
       │
       │ OAuth
       ▼
Mobile / Web
       │
       ▼
Fastify Gateway
       │
       ├── Verify Google/Facebook identity
       │
       ├── Find existing WooCommerce customer
       │
       └── If new → create WooCommerce customer
       │
       ▼
WooCommerce Customer
       │
       ▼
Gateway session
       │
       ▼
Mobile / Web
```

So when someone taps:

**"Continue with Google"**

your gateway would:

1. Authenticate them with Google.
2. Get verified identity information such as email/name.
3. Search WooCommerce for an existing customer with that email.
4. If found → associate the social identity with that customer.
5. If not found → create a **real WooCommerce customer** through the WooCommerce/WordPress API.
6. Create your gateway session.
7. From then on, orders are associated with that customer rather than being guest orders.

Same concept for Facebook.

### The important part: don't create a new Woo customer every time

You need an identity-linking strategy.

For example:

```text
Google
email: user@gmail.com
        │
        ▼
WooCommerce
        │
        ├── Existing customer?
        │       │
        │      YES
        │       ↓
        │   Login/link
        │
        └── NO
            ↓
       Create customer
```

And ideally maintain something like:

```text
customer_identity
────────────────────────────
provider       google
provider_id    123456789
woo_customer   5821
email          user@gmail.com
```

This becomes especially important if the same person later uses Facebook.

### What happens to orders?

This is the part you specifically want.

Instead of:

```text
Guest
 ↓
WooCommerce order
 ↓
Customer ID = 0
```

you want:

```text
Google/Facebook customer
 ↓
WooCommerce customer ID = 5821
 ↓
WooCommerce order
 ↓
customer_id = 5821
```

Then WooCommerce's customer list actually grows.

The customer can potentially have:

* order history
* account information
* lifetime spend
* order count
* customer segmentation
* future loyalty
* marketing eligibility
* abandoned-cart/customer analytics

That fits your **single-source-of-truth** principle very well. Your current architecture already puts WooCommerce in charge of customer/order state.

---

## But there's one major issue with Google/Facebook

**Email alone should not automatically be treated as proof that two identities are the same account.**

For example:

```text
Google → person@gmail.com
Facebook → person@gmail.com
```

You need an explicit account-linking strategy.

A robust model is:

```text
                    Customer
                       │
             WooCommerce ID 5821
                       │
          ┌────────────┴────────────┐
          │                         │
       Google                    Facebook
       provider                  provider
       ID: xxx                   ID: yyy
```

Then both social accounts point to the same WooCommerce customer.

---

# What about passwords?

This is another important consideration.

If you're creating WooCommerce customers through the API, you don't want to invent a password and then pretend Google/Facebook is their WordPress password.

Instead:

```text
Google/Facebook
       ↓
External authentication
       ↓
Gateway session
       ↓
WooCommerce customer
```

The customer authenticates through Google/Facebook, while your gateway handles the application session.

If later you want them to log into the actual WordPress/WooCommerce account directly, that's a separate concern and should be designed deliberately.

---

# Do you need to modify WordPress?

**Not necessarily.**

You can leave:

```text
WordPress
WooCommerce
WooCommerce database
WordPress authentication
```

untouched.

Your Fastify gateway can use the existing WooCommerce REST API to create/manage customers.

Conceptually:

```text
POST /v1/auth/google
        ↓
Verify Google token
        ↓
WooCommerce customer lookup
        ↓
Create customer if necessary
        ↓
Create gateway session
```

and:

```text
POST /v1/auth/facebook
        ↓
Verify Facebook token
        ↓
WooCommerce customer lookup
        ↓
Create customer if necessary
        ↓
Create gateway session
```

---

# 🔥 One thing I'd change in your current architecture

Your current documentation has:

```text
WordPress Login
Guest Checkout
In-App Register
```

I'd evolve that into:

```text
                  Authentication
                        │
        ┌───────────────┼───────────────┐
        │               │               │
      Google         Facebook       Phone/Password
        │               │               │
        └───────────────┼───────────────┘
                        ▼
                Fastify Identity Layer
                        │
                        ▼
               WooCommerce Customer
                        │
                        ▼
                 Gateway Session
```

And make **guest checkout optional**, rather than the default path for customers who want an account.

That gives you exactly what you're after:

> **Every Google/Facebook signup increases your actual WooCommerce customer base, and subsequent orders belong to that real customer instead of being guest orders.**

### One caution

Before implementing it, I'd audit your **current customer/auth/order API code** because your repository already has custom WordPress login, registration, guest sessions and order-scoping logic. The social-login implementation should integrate into that rather than creating a second, competing identity system.

If you want, I can review the **current auth/customer/order code in the repo specifically** and then give you a concrete implementation plan for **Google + Facebook → WooCommerce Customer → non-guest WooCommerce Order**, including the exact API routes and database/storage changes.
