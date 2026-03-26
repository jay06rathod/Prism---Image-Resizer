export default function ResizeSlider({ value, onChange }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4">
        <span className="border border-gray-600 px-3 py-1 rounded text-sm font-mono bg-[#1e1e1e]">{value}%</span>
        <input 
          type="range" min="1" max="100" value={value} onChange={onChange} 
          className="w-full cursor-pointer accent-gray-400" 
        />
      </div>
    </div>
  );
}