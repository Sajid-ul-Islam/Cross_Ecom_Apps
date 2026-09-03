# WordPress & WooCommerce Authentication Architecture Options

**Project:** Cross_Ecom_Apps (DEEN Commerce)  
**Date:** September 3, 2026  
**Context:** Connecting Mobile App (React Native/Expo) & Web App (Next.js 14) to WordPress / WooCommerce (`https://deencommerce.com`) for real customer and store administrator authentication.

---

## 1. Executive Summary & The Problem

WordPress core was designed for web browsers using session cookies (`wordpress_logged_in_*`) and CSRF nonces (`X-WP-Nonce`). By default:
* **WordPress core does NOT provide a public REST API endpoint to verify user passwords** (`POST /wp-json/wp/v2/login` does not exist).
* Direct web form POST requests to `https://deencommerce.com/wp-login.php` are intercepted or challenged by **Cloudflare bot protection** and security layers when initiated from cloud server IPs (such as Render or AWS).
* In our current gateway setup, catalog, products, categories, stock, coupons, Pathao tracking, and order placement are **100% connected live to WooCommerce**, but user registration and password validation have used local gateway storage and cookie simulation.

To bridge this gap and establish **real, production-grade WordPress customer and admin authentication**, three distinct implementation options are detailed below.

---

## 2. Option A: Custom Lightweight REST Endpoint (⭐ Recommended)

### Overview
Add a clean, secure, 20-line REST route directly to the active WordPress theme’s `functions.php` (or as a single-file Must-Use plugin `wp-content/mu-plugins/deen-auth.php`).

### How It Works
1. Fastify Gateway (`apps/api`) receives login request from Mobile/Web (`POST /v1/auth/login`).
2. Gateway sends an internal HTTPS request to `POST https://deencommerce.com/wp-json/deen/v1/login`.
3. WordPress executes its native core `wp_authenticate()` function in memory.
4. If valid, WordPress returns the user’s ID, name, email, and roles (e.g. `administrator` vs `customer`).
5. Gateway mints an HMAC-SHA256 session token and returns it to the client.

### Complete WordPress PHP Implementation
```php
<?php
/**
 * Plugin Name: DEEN Native Mobile & Web Auth Bridge
 * Description: Secure, lightweight REST endpoint for DEEN Commerce mobile and web apps.
 * Version: 1.0.0
 * Author: DEEN Commerce
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', function () {
    register_rest_route('deen/v1', '/login', array(
        'methods'             => 'POST',
        'callback'            => 'deen_rest_login_handler',
        'permission_callback' => '__return_true',
    ));
});

function deen_rest_login_handler(WP_REST_Request $request) {
    $username = sanitize_text_field($request->get_param('username'));
    $password = $request->get_param('password');

    if (empty($username) || empty($password)) {
        return new WP_Error(
            'missing_fields',
            'Username and password are required.',
            array('status' => 400)
        );
    }

    // Native WordPress core password & credentials check
    $user = wp_authenticate($username, $password);

    if (is_wp_error($user)) {
        return new WP_Error(
            'invalid_credentials',
            'Invalid username or password.',
            array('status' => 401)
        );
    }

    // Determine admin status
    $isAdmin = in_array('administrator', $user->roles) || in_array('shop_manager', $user->roles);

    return rest_ensure_response(array(
        'success' => true,
        'user'    => array(
            'id'          => $user->ID,
            'name'        => $user->display_name,
            'username'    => $user->user_login,
            'email'       => $user->user_email,
            'roles'       => $user->roles,
            'role'        => $isAdmin ? 'admin' : 'customer',
            'accountType' => $isAdmin ? 'admin' : 'customer',
        ),
    ));
}
```

### Advantages
* **Zero Plugin Overhead:** No third-party plugins that can become abandoned, vulnerable, or break on PHP/WordPress updates.
* **Blazing Fast:** Executes directly via WordPress core in under 30ms.
* **Full Cloudflare Compatibility:** REST API endpoints (`/wp-json/*`) are standard JSON APIs and are not blocked like `wp-login.php`.
* **Complete Role Awareness:** Identifies both WooCommerce regular customers and store administrators instantly.

---

## 3. Option B: Standard JWT Authentication Plugin

### Overview
Install the popular open-source plugin **"JWT Authentication for WP REST API"** (by Enrique Chavez) on the WordPress site.

### How It Works
1. Install plugin from WordPress Plugin Repository (`jwt-authentication-for-wp-rest-api`).
2. Plugin exposes standard endpoint: `POST https://deencommerce.com/wp-json/jwt-auth/v1/token`.
3. Client sends `{ "username": "...", "password": "..." }`.
4. WordPress validates credentials and returns a signed JSON Web Token.

### Required WordPress Configuration
In `wp-config.php`:
```php
define('JWT_AUTH_SECRET_KEY', 'your-top-secret-random-jwt-key-here-2026');
define('JWT_AUTH_CORS_ENABLE', true);
```

In `.htaccess` (Apache/LiteSpeed):
```apache
RewriteEngine on
RewriteCond %{HTTP:Authorization} ^(.*)
RewriteRule ^(.*) - [E=HTTP_AUTHORIZATION:%1]
SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1
```

### Advantages & Tradeoffs
* **Pros:** Standard community solution; well-documented in generic WordPress tutorials.
* **Cons:** Requires hosting `.htaccess` / Nginx configuration changes for `HTTP_AUTHORIZATION` headers; plugin updates can cause compatibility regressions; third-party dependency.

---

## 4. Option C: WooCommerce REST API Customer Creation & Sync (For Signups)

### Overview
Use the **official WooCommerce Core REST API (`/wp-json/wc/v3/customers`)** for all new account registrations, profile updates, and customer lookups.

### How It Works
1. Customer registers in mobile app or web app (`POST /v1/auth/register`).
2. Fastify Gateway signs the request with our existing WooCommerce Consumer Key & Secret (`ck_...`, `cs_...`).
3. Gateway calls WooCommerce:
   ```http
   POST https://deencommerce.com/wp-json/wc/v3/customers
   Content-Type: application/json
   Authorization: Basic <base64(consumer_key:consumer_secret)>

   {
     "email": "customer@example.com",
     "first_name": "Tanvir",
     "last_name": "Ahmed",
     "username": "017XXXXXXXX",
     "password": "CustomerSecurePassword123!",
     "billing": {
       "phone": "017XXXXXXXX",
       "city": "Dhaka",
       "state": "BD-13",
       "country": "BD"
     }
   }
   ```
4. WooCommerce creates the customer in the WordPress database.
5. The customer **immediately appears in WordPress Admin → WooCommerce → Customers**.

### Advantages & Tradeoffs
* **Pros:** Uses 100% official WooCommerce core API; zero plugins needed; customer profile, shipping addresses, and billing details are synchronized directly into WordPress.
* **Cons:** WooCommerce REST API handles *creation* and *management*, but does not handle *password verification* upon login (which is why Option C pairs perfectly with Option A).

---

## 5. Recommended Architecture: The Hybrid Best-Practice

The gold-standard enterprise architecture combines **Option A** (for login) and **Option C** (for registration):

```
                               ┌────────────────────────────────────────────────┐
                               │       Client (Mobile App & Web Frontend)       │
                               └───────────────────────┬────────────────────────┘
                                                       │ Clean HTTPS REST
                                                       ▼
                               ┌────────────────────────────────────────────────┐
                               │           Fastify Edge Gateway (apps/api)      │
                               └───────────────┬────────────────┬───────────────┘
                                               │                │
                        [Customer Registration]│                │[Customer & Admin Login]
                                               │                │
                                               ▼                ▼
                     ┌───────────────────────────┐    ┌───────────────────────────┐
                     │ WooCommerce v3 REST API   │    │ Custom deen/v1/login      │
                     │ POST /wp-json/wc/v3/      │    │ POST /wp-json/deen/v1/    │
                     │ customers                 │    │ login                     │
                     └─────────────┬─────────────┘    └─────────────┬─────────────┘
                                   │                                │
                                   └───────────────┬────────────────┘
                                                   ▼
                               ┌────────────────────────────────────────────────┐
                               │       WordPress Core (deencommerce.com)        │
                               └────────────────────────────────────────────────┘
```

1. **New User Signs Up:**  
   Gateway calls `POST /wp-json/wc/v3/customers` (Option C) → Real WooCommerce customer created.
2. **User / Admin Logs In:**  
   Gateway calls `POST /wp-json/deen/v1/login` (Option A) → Real password verified via `wp_authenticate()`.
3. **Session Minting:**  
   Gateway returns high-speed stateless HMAC-SHA256 session token to Mobile & Web.
4. **Orders & Checkout:**  
   Order placed with real `customer_id`, attaching all past order histories directly to their WooCommerce account.
