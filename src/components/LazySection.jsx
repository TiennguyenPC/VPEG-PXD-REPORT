import { Suspense } from 'react';

/** Suspense nhẹ cho lazy chunk — tránh block cả trang */
export default function LazySection({ label = 'nội dung', children, className = '' }) {
  return (
    <Suspense
      fallback={
        <div className={`py-8 flex justify-center ${className}`}>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <div className="w-5 h-5 border-2 border-[#5252ff]/30 border-t-[#5252ff] rounded-full animate-spin" />
            <span>Đang tải {label}…</span>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
