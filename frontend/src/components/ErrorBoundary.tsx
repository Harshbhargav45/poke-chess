import React, { Component, ReactNode } from "react";

export class ErrorBoundary extends Component<
    { children: ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, color: "red", backgroundColor: "#ffebee", height: "100vh" }}>
                    <h2>Something went wrong.</h2>
                    <pre>{this.state.error?.message}</pre>
                    <pre style={{ fontSize: "0.8em", overflow: "auto" }}>
                        {this.state.error?.stack}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}
