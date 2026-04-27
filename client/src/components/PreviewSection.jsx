import { useEffect, useState, useRef } from "react";

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFromRaw(bytes, raw) {
  if (!raw) return '';
  if (raw < 1024) return `${bytes} B`;
  if (raw < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PreviewSection({ originalImage, resizedImage, isProcessing, sizeInfo }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const prevResized = useRef(null);

  const origCount = useCountUp(sizeInfo?.original || 0);
  const largeCount = useCountUp(sizeInfo?.large || 0);

  useEffect(() => {
    if (resizedImage && resizedImage !== prevResized.current) {
      setImgLoaded(false);
      prevResized.current = resizedImage;
    }
  }, [resizedImage]);

  useEffect(() => {
    if (originalImage || resizedImage) {
      setTimeout(() => setVisible(true), 50);
    }
  }, [originalImage, resizedImage]);

  return (
    <div className={`flex justify-between items-center gap-4 mt-6 transition-all duration-500
      ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
    `}>

      {/* Original */}
      <div className="flex flex-col items-center">
        <div className="w-28 h-28 border border-white/10 rounded-2xl overflow-hidden bg-[#1e1e1e] flex items-center justify-center">
          {originalImage ? (
            <img
              src={originalImage}
              alt="Original"
              className="object-cover w-full h-full animate-[fadeIn_0.4s_ease-in]"
            />
          ) : (
            <span className="text-xs text-white/30">No Image</span>
          )}
        </div>
        <span className="text-xs text-white/50 mt-2">Original</span>
        {sizeInfo && (
          <span className="text-xs text-white/30">
            {formatFromRaw(origCount, sizeInfo.original)}
          </span>
        )}
      </div>

      {/* Arrow */}
      <div className="mx-4 w-12 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      {/* Resized */}
      <div className="flex flex-col items-center">
        <div className="w-28 h-28 border border-white/10 rounded-2xl overflow-hidden bg-[#1e1e1e] relative flex items-center justify-center">

          {/* Shimmer */}
          {isProcessing && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.2s_infinite]" />
          )}

          {/* Image with blur-to-clear */}
          {resizedImage && !isProcessing && (
            <img
              src={resizedImage}
              alt="Resized"
              onLoad={() => setImgLoaded(true)}
              className={`object-cover w-full h-full transition-all duration-700
                ${imgLoaded ? "blur-0 scale-100 opacity-100" : "blur-md scale-105 opacity-50"}
              `}
            />
          )}

          {!resizedImage && !isProcessing && (
            <span className="text-xs text-white/30">Result</span>
          )}
        </div>

        <span className="text-xs text-white/50 mt-2">Optimized</span>
        {sizeInfo && !isProcessing && (
          <span className="text-xs text-white/30">
            {formatFromRaw(largeCount, sizeInfo.large)}
          </span>
        )}

        {resizedImage && !isProcessing && (
          <button
            onClick={() => {
              const key = resizedImage.split('.amazonaws.com/')[1];
              window.open(`http://localhost:5000/api/download?key=${key}`, '_blank');
            }}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors duration-200 hover:underline"
          >
            Download
          </button>
        )}
      </div>

    </div>
  );
}