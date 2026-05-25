import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, AlertCircle, X, ZoomIn } from 'lucide-react';
import {
  extractDriveFileId,
  getImageFallbackUrls,
  rememberWorkingImageUrl,
} from '../../utils/siteImageUrl';

const LOAD_TIMEOUT_MS = 4500;

export default function SitePhoto({ src, status = 'ready', onRemove, alt = 'Ảnh hiện trường', priority = false }) {
  const [urlIndex, setUrlIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const loadedRef = useRef(false);

  const thumbCandidates = useMemo(() => getImageFallbackUrls(src, { variant: 'thumb' }), [src]);
  const fullCandidates = useMemo(() => getImageFallbackUrls(src, { variant: 'full' }), [src]);
  const fileId = useMemo(() => extractDriveFileId(src), [src]);

  useEffect(() => {
    setUrlIndex(0);
    setFailed(false);
    setLoaded(false);
    loadedRef.current = false;
  }, [src]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setLightboxOpen(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [lightboxOpen]);

  const displaySrc = thumbCandidates[urlIndex] || src;
  const lightboxSrc = fullCandidates[0] || displaySrc;

  const tryNextUrl = () => {
    if (urlIndex < thumbCandidates.length - 1) {
      setUrlIndex((i) => i + 1);
      setLoaded(false);
      loadedRef.current = false;
    } else {
      setFailed(true);
    }
  };

  useEffect(() => {
    if (!displaySrc || failed) return undefined;
    const timer = window.setTimeout(() => {
      if (!loadedRef.current) tryNextUrl();
    }, LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [displaySrc, failed, urlIndex]);

  const handleLoad = () => {
    loadedRef.current = true;
    setLoaded(true);
    if (fileId && displaySrc) rememberWorkingImageUrl(fileId, 'thumb', displaySrc);
  };

  const handleError = () => {
    tryNextUrl();
  };

  const openLightbox = () => {
    if (!failed && displaySrc) setLightboxOpen(true);
  };

  return (
    <>
    <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-[#2b3a5c] group bg-[var(--bg-hover)]">
      {!loaded && !failed && (
        <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2 bg-[var(--bg-hover)] animate-pulse">
          <Loader2 className="w-6 h-6 text-[var(--text-muted)] animate-spin" />
          <span className="text-[9px] text-[var(--text-muted)] font-medium">Đang tải ảnh...</span>
        </div>
      )}

      {status === 'uploading' && (
        <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 text-white text-[9px] font-semibold pointer-events-none">
          <Loader2 className="w-3 h-3 animate-spin shrink-0" />
          Lưu Drive...
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-x-0 top-0 z-20 bg-red-600/90 px-2 py-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-white shrink-0" />
          <span className="text-[9px] font-bold text-white truncate">Upload thất bại — ảnh xem trước</span>
        </div>
      )}

      {!failed ? (
        <button
          type="button"
          onClick={openLightbox}
          className="absolute inset-0 w-full h-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5252ff] z-10"
          title="Xem ảnh"
        >
          <img
            src={displaySrc}
            alt={alt}
            referrerPolicy="no-referrer"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            draggable={false}
            className={`w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
          <span className={`absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 text-white text-[9px] font-bold ${loaded ? 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100' : 'opacity-0'} transition-opacity`}>
            <ZoomIn className="w-3 h-3" />
            Xem
          </span>
        </button>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center bg-[#141d30]">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-[10px] text-slate-400">Không tải được ảnh</p>
          <p className="text-[9px] text-slate-500 break-all line-clamp-2">{src}</p>
        </div>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-2 right-2 bg-black/70 text-white w-7 h-7 flex items-center justify-center rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-30"
          title="Xóa ảnh"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>

    {lightboxOpen && createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 sm:p-6"
        style={{ minHeight: '100dvh', minWidth: '100vw' }}
        onClick={() => setLightboxOpen(false)}
        role="dialog"
        aria-modal="true"
        aria-label="Xem ảnh hiện trường"
      >
        <button
          type="button"
          onClick={() => setLightboxOpen(false)}
          className="fixed top-4 right-4 bg-white/10 hover:bg-white/20 text-white w-10 h-10 flex items-center justify-center rounded-full transition-colors z-[10000]"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={lightboxSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          decoding="async"
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          className="block max-w-[min(calc(100vw-2rem),1200px)] max-h-[min(calc(100dvh-2rem),calc(100vh-2rem),900px)] w-auto h-auto object-contain rounded-lg shadow-2xl mx-auto"
        />
      </div>,
      document.body
    )}
    </>
  );
}
