# Handoff Report: Responsive Hero Video Scaling (Worker M4)

**Agent**: Worker M4 (Specialist in Responsive Hero Video Scaling)  
**Date**: 2026-09-18T22:10:00Z  
**Parent Conversation ID**: `3d7286ce-a8a5-47f7-88b7-5a4f5e23173e`  
**Milestone**: M4 (Responsive Hero Video Aspect Ratio Scaling)  
**Status**: COMPLETE (Hard Handoff)

---

## 1. Observation

1. **Web Hero Video Container Discrepancy (`apps/web/components/HeroSlider.tsx`)**:
   - In `apps/web/components/HeroSlider.tsx` lines 186–213 prior to modification:
     ```css
     @media (min-width: 769px) {
       .hero-slider-clean {
         aspect-ratio: 21 / 9;
         min-height: 280px;
         max-height: 480px;
       }
     ...
     @media (max-width: 768px) {
       .hero-slider-clean {
         aspect-ratio: 16 / 9;
         min-height: 190px;
         max-height: 280px;
         margin-bottom: 18px;
       }
     ```
   - Native banner video assets served on web (`Denim-Web-Banner_1920x840pxl.mp4`, `END-OF-THE-SESSION-2_1920x8401.mp4`) are **1920 x 840 px**, having an exact aspect ratio of **16:7 (2.2857:1)**.
   - At desktop resolutions (e.g. 1920px wide Full HD), the container's `max-height: 480px` constraint enforced a 4.0:1 ratio ($1920 / 480$), cutting off $(840 - 480) / 840 = 42.8\%$ of the video vertically when rendered with `object-fit: cover`.
   - On mobile viewports (<768px), forcing `aspect-ratio: 16 / 9` with `min-height: 190px; max-height: 280px` caused the 16:7 video to exceed the container width by 28.57%, truncating 22.2% of the video's lateral (horizontal) edges.

2. **Mobile Native Hero Video Discrepancy (`apps/mobile/src/components/MotionHero.tsx`)**:
   - In `apps/mobile/src/components/MotionHero.tsx` lines 14–15 prior to modification:
     ```tsx
     const { width: SCREEN_WIDTH } = Dimensions.get("window");
     const HERO_HEIGHT = Math.round(SCREEN_WIDTH * (9 / 16)); // 16:9 cinematic edge-to-edge ratio
     ```
   - Native mobile video assets (`Home_1x11.mp4`, `END-OF-THE-SESSION-2_-1x11-1.mp4`) are **1080 x 1080 px** (**1:1 square**).
   - On a 390px wide device, `HERO_HEIGHT` evaluated to $390 \times (9 / 16) = 219\text{px}$.
   - The `<VideoView>` rendered inside `heroCard` with `contentFit="cover"`. In a 390x219px container, the 1080x1080 video scaled to 390x390px, causing $(390 - 219) / 390 = 43.8\%$ of the video to be clipped off vertically (approx. 85.5px clipped top and bottom).

3. **Exclusively Owned Files Guard**:
   - Only `apps/web/components/HeroSlider.tsx` and `apps/mobile/src/components/MotionHero.tsx` were modified. No other repository files were altered.

---

## 2. Logic Chain

1. **Desktop Web Scaling**:
   - Matching `.hero-slider-clean`'s `aspect-ratio` to `16 / 7` (the native 1920x840 ratio) and setting `max-height: none` allows the container height to scale strictly as $H = W \times (7 / 16)$ on all desktop viewports $\ge 769\text{px}$.
   - At 1440px width, height becomes 630px; at 1920px width, height becomes 840px.
   - Because the container aspect ratio matches the video aspect ratio identically (16:7), `object-fit: cover` renders the full video frame with 0px top/bottom crop and 0px lateral crop.

2. **Mobile Web Scaling**:
   - Changing mobile `@media (max-width: 768px)` `.hero-slider-clean` to `aspect-ratio: 16 / 7` and removing the rigid `min-height: 190px` / `max-height: 280px` clamps (`min-height: unset; max-height: none;`) ensures the container scales proportionally across all mobile screen widths (320px–768px).
   - For widescreen banner videos (16:7), container width and height match video dimensions exactly, eliminating all lateral truncation.
   - For square (1:1) slides, since the slide has an aspect ratio narrower/taller than 16:7, its width aligns 100% with the container width without any lateral cropping.

3. **Mobile Native Scaling**:
   - Setting `const HERO_HEIGHT = SCREEN_WIDTH;` establishes a true 1:1 square bounding container for `heroCard`.
   - In conjunction with `<VideoView contentFit="cover" style={StyleSheet.absoluteFill} />`, the 1080x1080 native mobile video fills $SCREEN\_WIDTH \times SCREEN\_WIDTH$ with uniform 1:1 geometry.
   - The vertical 43.8% cropping is completely eliminated, displaying the full video frame edge-to-edge.

---

## 3. Caveats

- For static photography slides on mobile web where the image has a portrait aspect ratio (e.g. 1080x1350 / 4:5), `object-fit: cover` with `object-position: center center` will center-crop vertically while preserving the entire horizontal width (no lateral clipping). This is standard responsive e-commerce banner behavior and preserves the horizontal integrity of brand imagery.
- No caveats regarding API dependencies or external services; these changes are pure CSS and layout dimensional alignments.

---

## 4. Conclusion

- In `apps/web/components/HeroSlider.tsx`: Desktop and mobile aspect ratios are aligned to native `16 / 7` (1920x840) with `max-height: none` and `min-height: unset` on mobile, eliminating 42.8% desktop vertical truncation and 22.2% mobile lateral edge clipping.
- In `apps/mobile/src/components/MotionHero.tsx`: `HERO_HEIGHT` is set to `SCREEN_WIDTH` (1:1 square), eliminating 43.8% vertical cropping of 1080x1080 mobile hero videos.
- Both requirements of Milestone M4 (Requirement R4) are fully satisfied with clean type safety and zero test regressions.

---

## 5. Verification Method

### Automated Commands
1. **Typecheck Entire Monorepo**:
   ```bash
   npm run typecheck:all
   ```
   *Result*: 0 compilation errors across `apps/api`, `apps/web`, and `apps/mobile`.

2. **Automated Monorepo Unit Tests**:
   ```bash
   npm test
   ```
   *Result*: 55/55 passed (0 failures) in 669ms.

3. **Git Diff Inspection**:
   ```bash
   git diff apps/web/components/HeroSlider.tsx apps/mobile/src/components/MotionHero.tsx
   ```
   *Result*: Shows exact, minimal modifications aligning aspect ratios and container heights.

### Invalidation Conditions
- Any revert of `.hero-slider-clean` desktop `aspect-ratio` to `21 / 9` or reintroduction of `max-height: 480px`.
- Any revert of `HERO_HEIGHT` in `MotionHero.tsx` from `SCREEN_WIDTH` back to `SCREEN_WIDTH * (9 / 16)`.
