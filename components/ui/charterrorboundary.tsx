"use client";
import { ErrorBoundary } from "react-error-boundary";
import ChartError from "./charterror";

const ChartErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary FallbackComponent={ChartError}>{children}</ErrorBoundary>
  );
};

export default ChartErrorBoundary;
