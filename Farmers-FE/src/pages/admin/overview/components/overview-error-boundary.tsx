import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class OverviewErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

  private readonly reset = () => {
    this.setState({ hasError: false });
  };

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <p className="text-base font-semibold">Dashboard gặp lỗi hiển thị</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Vui lòng thử tải lại vùng nội dung dashboard.
            </p>
            <button
              type="button"
              onClick={this.reset}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              Tải lại phần dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}
