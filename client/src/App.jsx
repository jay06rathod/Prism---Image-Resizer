import { useState } from 'react';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import ResizeSlider from './components/ResizeSlider';
import PreviewSection from './components/PreviewSection';
import AnimatedGradientBg from './components/AnimatingBG';
import PrismButton from "./components/PrismButton";

export default function App() {
  const [scale, setScale] = useState(100);
  const [original, setOriginal] = useState(null);
  const [resized, setResized] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sizeInfo, setSizeInfo] = useState(null);

  // Button click → fake processing
const handleProcess = async () => {
  if (!file) return;

  setLoading(true);
  setProcessing(true);

  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch("http://localhost:5000/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("Full response:", data);
    if (!res.ok) throw new Error(data.detail || 'Server error');
    setSizeInfo({
      original: file.size,
      large: data.sizes.large,
      medium: data.sizes.medium,
      thumbnail: data.sizes.thumbnail,
    });

    console.log(data);

    // 🔥 IMPORTANT: update this URL
    const baseUrl = "https://prism-resizer.s3.ap-south-1.amazonaws.com/";

    setResized(baseUrl + data.files.large);

  } catch (err) {
    console.log("Upload error:", err);
  }

  setProcessing(false);
  setLoading(false);
};

  const handleSliderChange = (e) => {
    setScale(e.target.value);
  };

  return (
    <AnimatedGradientBg>
      <div className="h-screen w-screen overflow-hidden text-white flex items-center justify-center p-4 font-sans relative z-10">
        
        <div className="p-6 w-full max-w-lg flex flex-col">
          <Header />
          
          <div className="border border-white/5 rounded-3xl p-5 bg-black/40 shadow-inner">
            
            {/* Upload */}
            <UploadZone setFile={setFile} setOriginal={setOriginal} />

            {/* Slider */}
            <ResizeSlider value={scale} onChange={handleSliderChange} />

            {/* Button */}
            <PrismButton 
              onClick={handleProcess} 
              disabled={!file} 
              loading={loading}
            >
              Resize Image
            </PrismButton>

            {/* Preview */}
            <PreviewSection 
              originalImage={original} 
              resizedImage={resized} 
              isProcessing={processing}
              sizeInfo={sizeInfo}
            />

          </div>
        </div>

      </div>
    </AnimatedGradientBg>
  );
}