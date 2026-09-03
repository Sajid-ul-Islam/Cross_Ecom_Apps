import React from "react";
import Svg, { Path, Circle, Rect, Line, Polygon, Polyline } from "react-native-svg";

/* ------------------------------------------------------------------ */
/*  In-house icon set — replaces `lucide-react-native`.                 */
/*                                                                      */
/*  lucide-react-native's peer range (React <=18) is unresolvable       */
/*  against React 19 (SDK 55), which broke the EAS install step.        */
/*  These are hand-drawn 24x24 stroke glyphs rendered with the          */
/*  react-native-svg dependency we already ship — zero extra peers.     */
/*  Drop-in API: `<Icon size={20} color="#111" strokeWidth={2} />`.     */
/* ------------------------------------------------------------------ */

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: object;
  [key: string]: unknown;
}

function make(nodes: React.ReactNode) {
  return function Icon({
    size = 24,
    color = "#16281f",
    strokeWidth = 2,
    style,
    ...rest
  }: IconProps) {
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
        {...rest}
      >
        {nodes}
      </Svg>
    );
  };
}

export const ArrowLeft = make(
  <>
    <Path d="M19 12H5" />
    <Path d="m12 19-7-7 7-7" />
  </>,
);

export const ArrowRight = make(
  <>
    <Path d="M5 12h14" />
    <Path d="m12 5 7 7-7 7" />
  </>,
);

export const ArrowDownNarrowWide = make(
  <>
    <Path d="m3 16 4 4 4-4" />
    <Path d="M7 20V4" />
    <Path d="M11 4h4" />
    <Path d="M11 8h7" />
    <Path d="M11 12h10" />
  </>,
);

export const ArrowUpNarrowWide = make(
  <>
    <Path d="m3 8 4-4 4 4" />
    <Path d="M7 4v16" />
    <Path d="M11 4h4" />
    <Path d="M11 8h7" />
    <Path d="M11 12h10" />
  </>,
);

export const Award = make(
  <>
    <Circle cx="12" cy="8" r="6" />
    <Path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </>,
);

export const Bell = make(
  <>
    <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </>,
);

export const Check = make(<Path d="M20 6 9 17l-5-5" />);

export const CheckCircle2 = make(
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="m9 12 2 2 4-4" />
  </>,
);

export const ChevronDown = make(<Path d="m6 9 6 6 6-6" />);

export const ChevronUp = make(<Path d="m18 15-6-6-6 6" />);

export const ChevronRight = make(<Path d="m9 18 6-6-6-6" />);

export const ChevronLeft = make(<Path d="m15 18-6-6 6-6" />);

export const Mail = make(
  <>
    <Rect width="20" height="16" x="2" y="4" rx="2" />
    <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </>,
);

export const Clock = make(
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </>,
);

export const Compass = make(
  <>
    <Circle cx="12" cy="12" r="10" />
    <Polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </>,
);

export const CreditCard = make(
  <>
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Line x1="2" y1="10" x2="22" y2="10" />
  </>,
);

export const Gift = make(
  <>
    <Rect x="3" y="8" width="18" height="4" rx="1" />
    <Path d="M12 8v13" />
    <Path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <Path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
  </>,
);

export const Heart = make(
  <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.51 4.04 3 5.5l7 7Z" />,
);

export const HelpCircle = make(
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <Path d="M12 17h.01" />
  </>,
);

export const Home = make(
  <>
    <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Path d="M9 22V12h6v10" />
  </>,
);

export const Layers = make(
  <>
    <Path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0l8.57-3.9a1 1 0 0 0 0-1.83Z" />
    <Path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    <Path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
  </>,
);

export const Lock = make(
  <>
    <Rect x="3" y="11" width="18" height="11" rx="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>,
);

export const Key = make(
  <>
    <Circle cx="7.5" cy="15.5" r="5.5" />
    <Path d="m21 2-9.6 9.6" />
    <Path d="m15.5 7.5 3 3L22 7l-3-3" />
  </>,
);

export const MapPin = make(
  <>
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <Circle cx="12" cy="10" r="3" />
  </>,
);

export const Minus = make(<Path d="M5 12h14" />);

export const Package = make(
  <>
    <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <Path d="m3.3 7 8.7 5 8.7-5" />
    <Path d="M12 22V12" />
    <Path d="m7.5 4.27 9 5.15" />
  </>,
);

export const Phone = make(
  <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
);

export const PhoneCall = make(
  <>
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    <Path d="M14.05 2a9 9 0 0 1 8 7.94" />
    <Path d="M14.05 6A5 5 0 0 1 18 10" />
  </>,
);

export const Plus = make(
  <>
    <Path d="M12 5v14" />
    <Path d="M5 12h14" />
  </>,
);

export const Ruler = make(
  <>
    <Path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
    <Path d="m14.5 12.5 2-2" />
    <Path d="m11.5 9.5 2-2" />
    <Path d="m8.5 6.5 2-2" />
    <Path d="m17.5 15.5 2-2" />
  </>,
);

export const Save = make(
  <>
    <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <Path d="M17 21v-8H7v8" />
    <Path d="M7 3v5h8" />
  </>,
);

export const Search = make(
  <>
    <Circle cx="11" cy="11" r="8" />
    <Path d="m21 21-4.3-4.3" />
  </>,
);

export const Shield = make(
  <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
);

export const ShieldCheck = make(
  <>
    <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <Path d="m9 12 2 2 4-4" />
  </>,
);

export const ShoppingBag = make(
  <>
    <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <Path d="M3 6h18" />
    <Path d="M16 10a4 4 0 0 1-8 0" />
  </>,
);

export const SlidersHorizontal = make(
  <>
    <Line x1="21" y1="4" x2="14" y2="4" />
    <Line x1="10" y1="4" x2="3" y2="4" />
    <Line x1="21" y1="12" x2="12" y2="12" />
    <Line x1="8" y1="12" x2="3" y2="12" />
    <Line x1="21" y1="20" x2="16" y2="20" />
    <Line x1="12" y1="20" x2="3" y2="20" />
    <Line x1="14" y1="2" x2="14" y2="6" />
    <Line x1="8" y1="10" x2="8" y2="14" />
    <Line x1="16" y1="18" x2="16" y2="22" />
  </>,
);

export const Sparkles = make(
  <>
    <Path d="M9.94 15.5 8.5 14.06 2.36 12.48a.5.5 0 0 1 0-.96L8.5 9.94 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0l1.58 6.14 1.44 1.44 6.14 1.58a.5.5 0 0 1 0 .96l-6.14 1.58-1.44 1.44-1.58 6.14a.5.5 0 0 1-.96 0z" />
    <Path d="M20 3v4" />
    <Path d="M22 5h-4" />
    <Path d="M4 17v2" />
    <Path d="M5 18H3" />
  </>,
);

export const Store = make(
  <>
    <Path d="m2 7 2.5-5h15L22 7" />
    <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <Path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <Path d="M2 7h20" />
    <Path d="M22 7v3a2 2 0 0 1-4 0V7" />
    <Path d="M14 7v3a2 2 0 0 1-4 0V7" />
    <Path d="M6 7v3a2 2 0 0 1-4 0V7" />
  </>,
);

export const Tag = make(
  <>
    <Path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z" />
    <Circle cx="7.5" cy="7.5" r="0.5" />
  </>,
);

export const Trash2 = make(
  <>
    <Path d="M3 6h18" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <Path d="M10 11v6" />
    <Path d="M14 11v6" />
  </>,
);

export const TrendingUp = make(
  <>
    <Path d="M16 7h6v6" />
    <Path d="m22 7-8.5 8.5-5-5L2 17" />
  </>,
);

export const Truck = make(
  <>
    <Path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <Path d="M15 18H9" />
    <Path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
    <Circle cx="17" cy="18" r="2" />
    <Circle cx="7" cy="18" r="2" />
  </>,
);

export const User = make(
  <>
    <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </>,
);

export const Users = make(
  <>
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>,
);

export const X = make(
  <>
    <Path d="M18 6 6 18" />
    <Path d="m6 6 12 12" />
  </>,
);

export const Info = make(
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 16v-4" />
    <Path d="M12 8h.01" />
  </>,
);

export const AlertCircle = make(
  <>
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="8" x2="12" y2="12" />
    <Line x1="12" y1="16" x2="12.01" y2="16" />
  </>,
);

export const Maximize2 = make(
  <>
    <Path d="M15 3h6v6" />
    <Path d="m21 3-7 7" />
    <Path d="M9 21H3v-6" />
    <Path d="m3 21 7-7" />
  </>,
);

export const ZoomIn = make(
  <>
    <Circle cx="11" cy="11" r="8" />
    <Path d="m21 21-4.3-4.3" />
    <Path d="M11 8v6" />
    <Path d="M8 11h6" />
  </>,
);

export const ZoomOut = make(
  <>
    <Circle cx="11" cy="11" r="8" />
    <Path d="m21 21-4.3-4.3" />
    <Path d="M8 11h6" />
  </>,
);

export const Eye = make(
  <>
    <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <Circle cx="12" cy="12" r="3" />
  </>,
);

export const EyeOff = make(
  <>
    <Path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <Path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <Path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <Line x1="2" x2="22" y1="2" y2="22" />
  </>,
);

export const Camera = make(
  <>
    <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <Circle cx="12" cy="13" r="3" />
  </>,
);

export const Edit = make(
  <>
    <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <Path d="m15 5 4 4" />
  </>,
);

export const Pencil = Edit;

export const ImageIcon = make(
  <>
    <Rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <Circle cx="9" cy="9" r="2" />
    <Path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </>,
);

export const RotateCcw = make(
  <>
    <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <Path d="M3 3v5h5" />
  </>,
);

export const FileText = make(
  <>
    <Path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <Path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <Path d="M10 9H8" />
    <Path d="M16 13H8" />
    <Path d="M16 17H8" />
  </>,
);

export const UploadCloud = make(
  <>
    <Path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <Path d="M12 12v9" />
    <Path d="m16 16-4-4-4 4" />
  </>,
);

export const Star = make(
  <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
);

export const MessageCircle = make(
  <Path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
);

export const BookOpen = make(
  <>
    <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </>,
);

export const Share2 = make(
  <>
    <Circle cx="18" cy="5" r="3" />
    <Circle cx="6" cy="12" r="3" />
    <Circle cx="18" cy="19" r="3" />
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </>,
);

export const Navigation = make(
  <Polygon points="3 11 22 2 13 21 11 13 3 11" />,
);

export const Trophy = make(
  <>
    <Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <Path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <Path d="M4 22h16" />
    <Path d="M10 14.66V17c0 .55-.45.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <Path d="M14 14.66V17c0 .55.45.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <Path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </>,
);

export const LogOut = make(
  <>
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </>,
);

/* Brand glyphs — rendered white (fill/stroke) on coloured round buttons. */
function makeFilled(nodes: React.ReactNode) {
  return function Icon({ size = 24, color = "#FFFFFF", style, ...rest }: IconProps) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style} {...rest}>
        {nodes}
      </Svg>
    );
  };
}

export const WhatsApp = make(
  <>
    <Path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.7L3 21l1.8-5.8A8.5 8.5 0 1 1 21 11.5z" />
    <Path d="M8.8 8.6c0 3 2.5 5.5 5.5 5.5l1-1.5c.3-.4.9-.4 1.3-.1l1.7 1c.4.3.5.9.2 1.3-1 1.3-2.6 1.2-3.8.2" />
  </>,
);

export const Instagram = make(
  <>
    <Rect x="3" y="3" width="18" height="18" rx="5" />
    <Circle cx="12" cy="12" r="4" />
    <Circle cx="17" cy="7" r="1.2" fill="#fff" stroke="none" />
  </>,
);

export const Facebook = make(
  <>
    <Rect x="3" y="3" width="18" height="18" rx="4" />
    <Path d="M14 8h-2c-1.1 0-2 .9-2 2v1.5H8v2h2V19h2v-5.5h2l.5-2H12V10c0-.3.2-.5.5-.5H14V8z" />
  </>,
);


