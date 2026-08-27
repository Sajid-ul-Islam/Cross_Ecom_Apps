import React, { useState, useCallback } from "react";
import { RefreshControl } from "react-native";
import { useTheme } from "../context/ThemeContext";

/**
 * Deduplicates the pull-to-refresh pattern found across every tab screen.
 *
 * Returns `refreshControl` — a ready-made `<RefreshControl>` element that
 * screens pass directly to ScrollView/FlatList. Also returns `refreshing`
 * and `onRefresh` for screens that need them separately (e.g. FlatList).
 *
 * Usage:
 *   const { refreshControl } = usePullToRefresh(loadData);
 *   <ScrollView refreshControl={refreshControl}>...</ScrollView>
 *
 *   // Or for FlatList which needs the props separately:
 *   const { refreshing, onRefresh } = usePullToRefresh(loadData);
 *   <FlatList refreshing={refreshing} onRefresh={onRefresh} />
 *
 * @param loadData - The async function to call when the user pulls to refresh.
 *                   The hook wraps it with refreshing state automatically.
 */
export function usePullToRefresh(
  loadData: () => void | Promise<void>
): {
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  refreshControl: React.ReactElement;
} {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.indigo}
      colors={[colors.indigo]}
    />
  );

  return { refreshing, onRefresh, refreshControl };
}
