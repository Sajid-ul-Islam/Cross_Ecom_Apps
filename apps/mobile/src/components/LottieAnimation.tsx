import React, { useRef, useEffect } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import LottieView from "lottie-react-native";

export type LottieAnimationType = "success" | "truck" | "cart" | "loading" | "sparkle";

// Lightweight embedded Lottie vector animation definitions
const ANIMATIONS: Record<LottieAnimationType, any> = {
  success: {
    v: "5.5.7",
    fr: 60,
    ip: 0,
    op: 60,
    w: 100,
    h: 100,
    nm: "SuccessCheck",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Circle",
        sr: 1,
        ks: {
          o: { k: 100 },
          r: { k: 0 },
          p: { k: [50, 50, 0] },
          a: { k: [0, 0, 0] },
          s: {
            k: [
              { t: 0, s: [0, 0, 100], e: [110, 110, 100] },
              { t: 25, s: [110, 110, 100], e: [100, 100, 100] },
            ],
          },
        },
        ao: 0,
        shapes: [
          {
            ty: "el",
            d: 1,
            s: { k: [70, 70] },
            p: { k: [0, 0] },
            nm: "CirclePath",
          },
          {
            ty: "fl",
            c: { k: [0.08, 0.65, 0.42, 1] }, // Emerald #15A66B
            o: { k: 100 },
            nm: "Fill",
          },
        ],
      },
      {
        ddd: 0,
        ind: 2,
        ty: 4,
        nm: "Checkmark",
        sr: 1,
        ks: {
          o: {
            k: [
              { t: 15, s: [0], e: [100] },
              { t: 25, s: [100], e: [100] },
            ],
          },
          r: { k: 0 },
          p: { k: [50, 50, 0] },
          a: { k: [0, 0, 0] },
          s: {
            k: [
              { t: 15, s: [60, 60, 100], e: [100, 100, 100] },
            ],
          },
        },
        ao: 0,
        shapes: [
          {
            ty: "sh",
            ks: {
              k: {
                i: [[0, 0], [0, 0], [0, 0]],
                o: [[0, 0], [0, 0], [0, 0]],
                v: [[-14, 0], [-4, 10], [14, -8]],
                c: false,
              },
            },
            nm: "CheckPath",
          },
          {
            ty: "st",
            c: { k: [1, 1, 1, 1] },
            o: { k: 100 },
            w: { k: 6 },
            lc: 2,
            lj: 2,
            nm: "Stroke",
          },
        ],
      },
    ],
  },
  truck: {
    v: "5.5.7",
    fr: 60,
    ip: 0,
    op: 60,
    w: 120,
    h: 80,
    nm: "DeliveryTruck",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "TruckBody",
        sr: 1,
        ks: {
          o: { k: 100 },
          r: { k: 0 },
          p: {
            k: [
              { t: 0, s: [55, 38, 0], e: [65, 38, 0] },
              { t: 30, s: [65, 38, 0], e: [55, 38, 0] },
              { t: 60, s: [55, 38, 0], e: [55, 38, 0] },
            ],
          },
          a: { k: [0, 0, 0] },
          s: { k: [100, 100, 100] },
        },
        ao: 0,
        shapes: [
          {
            ty: "rc",
            d: 1,
            s: { k: [50, 30] },
            p: { k: [-10, -5] },
            r: { k: 4 },
            nm: "BodyBox",
          },
          {
            ty: "fl",
            c: { k: [0.98, 0.29, 0, 1] }, // Brand Orange #FA4A00
            o: { k: 100 },
            nm: "FillBody",
          },
        ],
      },
    ],
  },
  cart: {
    v: "5.5.7",
    fr: 60,
    ip: 0,
    op: 60,
    w: 100,
    h: 100,
    nm: "CartBounce",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Bag",
        sr: 1,
        ks: {
          o: { k: 100 },
          r: {
            k: [
              { t: 0, s: [0], e: [-8] },
              { t: 15, s: [-8], e: [8] },
              { t: 30, s: [8], e: [-4] },
              { t: 45, s: [-4], e: [0] },
            ],
          },
          p: { k: [50, 50, 0] },
          a: { k: [0, 0, 0] },
          s: { k: [100, 100, 100] },
        },
        ao: 0,
        shapes: [
          {
            ty: "rc",
            d: 1,
            s: { k: [42, 46] },
            p: { k: [0, 4] },
            r: { k: 6 },
            nm: "BagBody",
          },
          {
            ty: "fl",
            c: { k: [0.12, 0.18, 0.35, 1] }, // Indigo #1E2E59
            o: { k: 100 },
            nm: "Fill",
          },
        ],
      },
    ],
  },
  loading: {
    v: "5.5.7",
    fr: 60,
    ip: 0,
    op: 60,
    w: 60,
    h: 60,
    nm: "LoadingPulse",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Ring",
        sr: 1,
        ks: {
          o: { k: 100 },
          r: {
            k: [
              { t: 0, s: [0], e: [360] },
            ],
          },
          p: { k: [30, 30, 0] },
          a: { k: [0, 0, 0] },
          s: { k: [100, 100, 100] },
        },
        ao: 0,
        shapes: [
          {
            ty: "el",
            d: 1,
            s: { k: [38, 38] },
            p: { k: [0, 0] },
            nm: "Circle",
          },
          {
            ty: "st",
            c: { k: [0.98, 0.29, 0, 1] },
            o: { k: 100 },
            w: { k: 4 },
            lc: 2,
            nm: "Stroke",
          },
        ],
      },
    ],
  },
  sparkle: {
    v: "5.5.7",
    fr: 60,
    ip: 0,
    op: 60,
    w: 60,
    h: 60,
    nm: "SparkleEffect",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Star",
        sr: 1,
        ks: {
          o: {
            k: [
              { t: 0, s: [0], e: [100] },
              { t: 30, s: [100], e: [0] },
            ],
          },
          r: { k: [ { t: 0, s: [0], e: [90] } ] },
          p: { k: [30, 30, 0] },
          a: { k: [0, 0, 0] },
          s: {
            k: [
              { t: 0, s: [40, 40, 100], e: [120, 120, 100] },
            ],
          },
        },
        ao: 0,
        shapes: [
          {
            ty: "el",
            d: 1,
            s: { k: [16, 16] },
            p: { k: [0, 0] },
            nm: "StarPoint",
          },
          {
            ty: "fl",
            c: { k: [0.94, 0.73, 0.32, 1] }, // Gold #F0B952
            o: { k: 100 },
            nm: "Fill",
          },
        ],
      },
    ],
  },
};

interface LottieAnimationProps {
  type: LottieAnimationType;
  size?: number;
  loop?: boolean;
  autoPlay?: boolean;
  style?: StyleProp<ViewStyle>;
  source?: any;
}

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  type,
  size = 80,
  loop = true,
  autoPlay = true,
  style,
  source,
}) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (autoPlay && animationRef.current) {
      animationRef.current.play();
    }
  }, [autoPlay]);

  const animationSource = source || ANIMATIONS[type] || ANIMATIONS.success;

  return (
    <View style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, style]}>
      <LottieView
        ref={animationRef}
        source={animationSource}
        autoPlay={autoPlay}
        loop={loop}
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
};
