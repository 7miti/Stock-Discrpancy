import { useState } from 'react';
import { AppView, ShoeItem } from './types';
import Home from './components/Home';
import CameraScanner from './components/CameraScanner';
import EditResult from './components/EditResult';
import ShoeList from './components/ShoeList';
import { extractShoeLabel } from './lib/gemini';
import { saveShoe } from './lib/storage';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [extractedData, setExtractedData] = useState<Partial<ShoeItem>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (base64Img: string) => {
    setCapturedImage(base64Img);
    setIsProcessing(true);
    setView('edit'); // Transition immediately to show loading state on the edit screen

    try {
      const data = await extractShoeLabel(base64Img);
      if (!data || Object.keys(data).length === 0) {
        throw new Error("No data could be extracted from this image.");
      }
      setExtractedData(data);
    } catch (e: any) {
      console.error("Extraction error:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      // Give more specific hints for common failures
      if (errorMessage.includes("API_KEY") || errorMessage.includes("API key")) {
        alert("Gemini API key is missing or invalid. Please check your AI Studio settings.");
      } else {
        alert(`Problem extracting data: ${errorMessage}\nYou can still enter details manually.`);
      }
      setExtractedData({});
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveScanned = (shoe: ShoeItem) => {
    saveShoe(shoe);
    setView('list'); // Show inventory after saving
  };

  const handleDiscard = () => {
    setView('home');
    setCapturedImage('');
    setExtractedData({});
  };

  return (
    <div className="w-full h-screen mx-auto max-w-md bg-[#0a0a0b] text-[#e0e0e0] shadow-xl relative overflow-hidden flex flex-col font-sans">
      {view === 'home' && <Home onNavigate={(v) => setView(v as AppView)} />}
      
      {view === 'scanner' && (
        <CameraScanner 
          onCapture={handleCapture} 
          onClose={() => setView('home')} 
        />
      )}
      
      {view === 'edit' && (
        isProcessing ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="animate-spin text-[#6366f1]" size={48} />
            <div className="text-gray-400 font-medium pb-20">Analyzing shoe label...</div>
          </div>
        ) : (
          <EditResult 
            imageUrl={capturedImage} 
            initialData={extractedData} 
            onSave={handleSaveScanned} 
            onDiscard={handleDiscard} 
          />
        )
      )}

      {view === 'list' && <ShoeList onBack={() => setView('home')} />}
    </div>
  );
}

