import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AlertCircle, RotateCcw } from "./Icons";
import { reportBug } from "../services/gateway";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ScreenErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportBug({
      severity: "crash",
      route: "profile",
      message: `ProfileScreen crash caught: ${error?.message || String(error)}`,
      stack: errorInfo?.componentStack || error?.stack || undefined,
    }).catch(() => {});
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <AlertCircle size={32} color="#EF4444" />
            </View>
            <Text style={styles.title}>{this.props.fallbackTitle || "Account Profile Unavailable"}</Text>
            <Text style={styles.message}>
              We encountered a temporary hiccup loading your account information. Your saved data is safe.
            </Text>
            <TouchableOpacity style={styles.retryBtn} activeOpacity={0.85} onPress={this.handleRetry}>
              <RotateCcw size={16} color="#FFFFFF" />
              <Text style={styles.retryBtnText}>RELOAD PROFILE</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0D111A",
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#161C2A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
    color: "#F4F6FC",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: "#8C96B2",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6366F1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: "100%",
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
