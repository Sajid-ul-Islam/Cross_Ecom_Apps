import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Polyline, Path, Circle, Rect, Line } from "react-native-svg";
import { ThemeColors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";
import { bdt } from "../services/gateway";

/* ----------------------------- Sparkline ----------------------------- */
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 280,
  height = 56,
  color,
  fill = true,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const strokeColor = color || colors.indigo;

  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const pad = 4;
  const usableH = height - pad * 2;

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = pad + usableH - ((v - min) / range) * usableH;
    return { x, y };
  });

  const line = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area =
    `M ${points[0].x.toFixed(1)},${(height - pad).toFixed(1)} ` +
    points.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") +
    ` L ${points[points.length - 1].x.toFixed(1)},${(height - pad).toFixed(1)} Z`;

  const last = points[points.length - 1];

  return (
    <Svg width={width} height={height} style={styles.svg}>
      {fill && <Path d={area} fill={strokeColor} opacity={0.1} />}
      <Polyline points={line} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={last.x} cy={last.y} r={3} fill={strokeColor} />
    </Svg>
  );
};

/* ----------------------- Category Bar Chart ------------------------ */
interface CategoryBarProps {
  data: { category: string; count: number }[];
  max?: number;
}

export const CategoryBars: React.FC<CategoryBarProps> = ({ data, max }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const top = (max ?? Math.max(...data.map((d) => d.count), 1));
  const palette = [colors.indigo, colors.denimStitch, colors.emerald, colors.crimson, colors.amber, colors.bkash, colors.nagad];
  return (
    <View style={styles.barWrap}>
      {data.map((d, i) => {
        const pct = Math.max(4, Math.round((d.count / top) * 100));
        return (
          <View key={d.category} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>{d.category}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: palette[i % palette.length] }]} />
            </View>
            <Text style={styles.barValue}>{d.count}</Text>
          </View>
        );
      })}
    </View>
  );
};

/* --------------------------- Donut (stock) --------------------------- */
interface DonutProps {
  value: number; // main slice (e.g. in stock)
  total: number;
  label: string;
  color?: string;
  size?: number;
}

export const Donut: React.FC<DonutProps> = ({ value, total, label, color, size = 84 }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const strokeColor = color || colors.emerald;
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const frac = total > 0 ? value / total : 0;
  const dash = circ * frac;
  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke={colors.border} strokeWidth={8} fill="none" />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={strokeColor}
          strokeWidth={8}
          fill="none"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <Circle cx={cx} cy={cy} r={r * 0.62} stroke={colors.cardSecondary} strokeWidth={6} fill="none" />
      </Svg>
      <Text style={styles.donutValue}>{Math.round(frac * 100)}%</Text>
      <Text style={styles.donutLabel}>{label}</Text>
    </View>
  );
};

/* --------------------------- KPI Tile ------------------------------- */
interface KpiProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

export const KpiTile: React.FC<KpiProps> = ({ label, value, sub, accent }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const accentColor = accent || colors.indigo;
  return (
    <View style={styles.kpi}>
      <View style={[styles.kpiAccent, { backgroundColor: accentColor }]} />
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </View>
  );
};

/* ----------------------------- Price Bars --------------------------- */
interface PriceBarProps {
  max: number;
  markers: { label: string; value: number; color: string }[];
}

export const PriceBars: React.FC<PriceBarProps> = ({ max, markers }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.barWrap}>
      {markers.map((m) => {
        const pct = Math.max(3, Math.round((m.value / (max || 1)) * 100));
        return (
          <View key={m.label} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>{m.label}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: m.color }]} />
            </View>
            <Text style={styles.barValue}>{bdt(m.value)}</Text>
          </View>
        );
      })}
    </View>
  );
};

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    svg: { alignSelf: "center" },
    barWrap: { gap: 8, marginTop: 4 },
    barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    barLabel: { width: 78, fontSize: 10, fontWeight: "700", color: colors.sub, textTransform: "uppercase" },
    barTrack: { flex: 1, height: 10, backgroundColor: colors.cardSecondary, borderRadius: 5, overflow: "hidden" },
    barFill: { height: 10, borderRadius: 5 },
    barValue: { width: 40, textAlign: "right", fontSize: 11, fontWeight: "800", color: colors.ink },
    donutValue: { position: "absolute", top: 30, fontSize: 16, fontWeight: "900", color: colors.ink },
    donutLabel: { fontSize: 10, color: colors.sub, marginTop: 2 },
    kpi: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      position: "relative",
      overflow: "hidden",
    },
    kpiAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },
    kpiLabel: { fontSize: 10, color: colors.sub, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
    kpiValue: { fontSize: 18, fontWeight: "900", color: colors.ink },
    kpiSub: { fontSize: 10, color: colors.sub, marginTop: 2 },
  });
}
