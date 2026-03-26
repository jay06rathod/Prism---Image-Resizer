import { useRef, useState } from "react";

export default function UploadZone({ setFile, setOriginal }) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFile = (file) => {
    if (!file) return;

    setFile(file); // 🔥 enables button
    setOriginal(URL.createObjectURL(file)); // 🔥 shows preview
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  return (
    <div className="relative mb-8">
      <div
        className={`
          w-full h-48 rounded-2xl flex flex-col justify-center items-center cursor-pointer
          transition-all duration-300
          ${dragging 
            ? "border border-blue-400 bg-white/5 scale-[1.02]" 
            : "border border-white/10 bg-black/40 hover:scale-[1.02]"
          }
        `}
        onClick={handleClick}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleChange}
        />

        <div className="flex flex-col items-center text-white text-center pointer-events-none">
          
          <svg
            className="w-12 h-12 mb-3 text-blue-400 opacity-90"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
          </svg>

          <span className="font-semibold text-base text-white/80">
            Click or drag to upload
          </span>

          <span className="text-xs text-white/40 mt-1">
            PNG, JPG, WebP supported
          </span>

        </div>
      </div>
    </div>
  );
}