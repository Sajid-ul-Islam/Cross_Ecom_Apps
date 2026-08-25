# Jeans Fit Detection & Size Charts — DEEN Commerce

> Architectural reference and data specification for jeans fit categorization and size guide rendering.

---

## 1. Fit Architecture

Jeans in the DEEN catalog (`deencommerce.com`) are structured across three distinct fits:
1. **SLIM FIT** (e.g. "High-End Raw Washed Jeans - Slim Fit")
2. **REGULAR FIT**
3. **STRAIGHT FIT**

### Fit Extraction Pipeline
- In WooCommerce, **fit is defined by product category name**, rather than a custom `pa_fit` attribute.
- The Fastify Gateway ([woo.ts](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/apps/api/src/woo.ts)) extracts fit dynamically via regex pattern matching on category titles:
  ```ts
  // Extracts "Slim" / "Regular" / "Straight"
  const fitMatch = categoryNames.find(c => /\b(slim|regular|straight)\s*fit\b/i.test(c));
  ```
- The extracted `fit` property flows through the catalog JSON into the mobile `Product.fit` interface.

---

## 2. Size Guide Modal Integration

In the mobile app, [SizeGuideModal.tsx](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/apps/mobile/src/components/SizeGuideModal.tsx) accepts the product's `fit` prop and displays the appropriate chart and header subtitle (e.g., *"Slim Fit · Raw Selvedge Denim Sizing"*).

### Measurement Spec Table Format
To replace the generic fallback denim chart with specific per-fit measurements, populate `FIT_CHARTS` with official brand measurements:

| Size | Waist (in) | Hip (in) | Thigh (in) | Leg Opening (in) | Length (in) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **28** | 29.5 | 36.5 | 21.0 | 13.0 | 40.0 |
| **30** | 31.5 | 38.5 | 22.0 | 13.5 | 40.5 |
| **32** | 33.5 | 40.5 | 23.0 | 14.0 | 41.0 |
| **34** | 35.5 | 42.5 | 24.0 | 14.5 | 41.5 |
| **36** | 37.5 | 44.5 | 25.0 | 15.0 | 42.0 |
| **38** | 39.5 | 46.5 | 26.0 | 15.5 | 42.5 |

---

## 3. Implementation Status

- [x] Gateway fit extraction from WooCommerce category names ✅
- [x] Mobile `Product.fit` type definition and PDP pass-through ✅
- [x] Dynamic `SizeGuideModal` fit subtitle and routing ✅
- [ ] Brand-specific measurement numbers inserted into `FIT_CHARTS` (Awaiting brand team final spec numbers; currently uses standard denim baseline).
