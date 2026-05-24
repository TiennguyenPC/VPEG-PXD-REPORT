import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] p-6">
          <div className="max-w-lg w-full rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center space-y-4">
            <h1 className="text-lg font-bold text-red-400">Đã xảy ra lỗi</h1>
            <p className="text-sm text-[var(--text-muted)]">
              {this.state.error?.message || 'Something went wrong.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#5252ff] text-white hover:bg-[#4242ee]"
              >
                Thử lại
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-[var(--border-main)] hover:bg-[var(--bg-hover)]"
              >
                Tải lại trang
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
