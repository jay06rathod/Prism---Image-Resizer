function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PreviewSection({ originalImage, resizedImage, isProcessing, sizeInfo  }) {
  return (
    <div className="flex justify-between items-center gap-4 mt-6">

      {/* Original */}
      <div className="flex flex-col items-center">
        <div className="w-28 h-28 border border-white/10 rounded-2xl overflow-hidden bg-[#1e1e1e] flex items-center justify-center">
          
          {originalImage ? (
            <img 
              src={originalImage} 
              alt="Original" 
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-xs text-white/30">No Image</span>
          )}

        </div>
        <span className="text-xs text-white/50 mt-2">Original</span>
        {sizeInfo && (
          <span className="text-xs text-white/30">{formatSize(sizeInfo.original)}</span>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 w-12 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

      {/* Resized */}
      <div className="flex flex-col items-center">
        <div className="w-28 h-28 border border-white/10 rounded-2xl overflow-hidden bg-[#1e1e1e] relative flex items-center justify-center">

          {/* Shimmer */}
          {isProcessing && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.2s_infinite]" />
          )}

          {/* Image */}
          {resizedImage && !isProcessing && (
            <img 
              src={resizedImage} 
              alt="Resized" 
              className="object-cover w-full h-full animate-[fadeIn_0.4s_ease-in]"
            />
          )}

          {/* Placeholder */}
          {!resizedImage && !isProcessing && (
            <span className="text-xs text-white/30">Result</span>
          )}

        </div>
        <span className="text-xs text-white/50 mt-2">Optimized</span>
          {sizeInfo && !isProcessing && (
            <span className="text-xs text-white/30">{formatSize(sizeInfo.large)}</span>
          )}
        {resizedImage && !isProcessing && (
        <button
          onClick={() => {
            const key = resizedImage.split('.amazonaws.com/')[1]
            window.open(`http://localhost:5000/api/download?key=${key}`, '_blank')
          }}
          className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition"
        >
          Download
        </button>
      )}
      </div>

    </div>
  );
}