import { useRef, useState } from "react";

export default function UploadZone({ setFile, setOriginal }) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState(null);

  const handleClick = () => fileInputRef.current.click();

  const handleFile = (file) => {
    if (!file) return;
    setFile(file);
    setFileName(file.name);
    setOriginal(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="relative mb-8">
      <div
        className={`
          w-full h-48 rounded-2xl flex flex-col justify-center items-center cursor-pointer
          transition-all duration-300
          ${dragging
            ? "border border-blue-400 bg-blue-500/10 scale-[1.02] shadow-[0_0_20px_rgba(96,165,250,0.2)]"
            : fileName
              ? "border border-green-400/40 bg-green-500/5 hover:scale-[1.01]"
              : "border border-white/10 bg-black/40 hover:border-white/20 hover:bg-white/5 hover:scale-[1.01]"
          }
        `}
        onClick={handleClick}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        <div className="flex flex-col items-center text-white text-center pointer-events-none">
          <svg
            className={`w-12 h-12 mb-3 transition-all duration-300
              ${dragging ? "text-blue-400 animate-bounce" : fileName ? "text-green-400" : "text-blue-400 opacity-90"}
            `}
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          >
            {fileName
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            }
          </svg>

          <span className="font-semibold text-base text-white/80 transition-all duration-300">
            {fileName
              ? <span className="text-green-400 text-sm truncate max-w-[200px] block">{fileName}</span>
              : "Click or drag to upload"
            }
          </span>

          <span className="text-xs text-white/40 mt-1">
            {fileName ? "Click to change image" : "PNG, JPG, WebP supported"}
          </span>
        </div>
      </div>
    </div>
  );
}