import React from 'react';
import { isChunkLoadError } from './utils/lazyWithRetry';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, isChunkError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error', error, errorInfo);

    if (isChunkLoadError(error) && !sessionStorage.getItem('epc-chunk-reload')) {
      sessionStorage.setItem('epc-chunk-reload', '1');
      window.location.reload();
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, isChunkError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] p-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-[#5252ff]/30 border-t-[#5252ff] rounded-full animate-spin" />
              <p className="text-sm text-[var(--text-muted)]">Đang tải phiên bản mới...</p>
            </div>
          </div>
        );
      }

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
