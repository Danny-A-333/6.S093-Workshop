'use client'
import { useState, useEffect } from "react";

const BACKEND_URL = 'https://sundai-backend-55967553950.us-east4.run.app';
const COMICS_PER_PAGE = 3;

interface ComicPanel {
  prompt: string;
  caption: string;
  imageUrl?: string;
}

// Add new interface for history response
interface HistoryItem {
  prompt: string;
  caption: string;
  image_url: string;
  created_at: string;
}

const Home = () => {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panels, setPanels] = useState<ComicPanel[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);

  useEffect(() => {
    // Check for saved dark mode preference
    const savedMode = localStorage.getItem('darkMode');
    setIsDarkMode(savedMode === 'true');
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    setPanels([]);
    
    try {
      // First, generate the plot
      console.log('Generating plot...');
      const plotResponse = await fetch('/api/generate/generate_plot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: inputText })
      });

      if (!plotResponse.ok) {
        throw new Error('Failed to generate plot');
      }

      const plotData = await plotResponse.json();
      console.log('Plot data received:', plotData);

      if (!plotData.comics || !Array.isArray(plotData.comics)) {
        throw new Error('Invalid plot data received');
      }

      // Extract prompts for image generation
      const prompts = plotData.comics.map((panel: { prompt: string }) => panel.prompt);
      
      // Generate images
      console.log('Generating images...');
      const imageResponse = await fetch('/api/generate/generate_img', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompts: prompts })
      });

      if (!imageResponse.ok) {
        throw new Error('Failed to generate images');
      }

      const imageData = await imageResponse.json();
      console.log('Image data received:', imageData);

      // Combine plot and images
      const completePanels = plotData.comics.map((panel: { prompt: string; caption: string }, index: number) => ({
        ...panel,
        imageUrl: imageData.imageUrls[index]
      }));

      setPanels(completePanels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate comic');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    setError(null);
    setPanels([]);
    
    try {
      const skip = historyPage * COMICS_PER_PAGE;
      const response = await fetch(`${BACKEND_URL}/history?limit=${COMICS_PER_PAGE}&skip=${skip}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load history');
      }
      
      const history = await response.json() as HistoryItem[];
      
      if (history.length === 0) {
        setError('No more comics to load');
        return;
      }

      // Reverse the array to display in correct order
      const formattedPanels = history.reverse().map((item: HistoryItem) => ({
        prompt: item.prompt,
        caption: item.caption || item.prompt,
        imageUrl: item.image_url,
        isFromHistory: true
      }));
      
      setPanels(formattedPanels);
      setHistoryPage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
      console.error('History error:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <div className={`w-full min-h-screen relative pb-16 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Foley Comic Generator</h1>

        <p className={`text-center mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Enter your prompt below to generate a comic about Foley&apos;s adventures!
        </p>

        <div className="space-y-4 mb-8">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter your story prompt here..."
            rows={4}
            className={`w-full px-4 py-2 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300'
            }`}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full px-4 py-2 rounded-lg disabled:opacity-50 
              ${isDarkMode 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            {isLoading ? 'Generating...' : 'Generate Comic'}
          </button>

          <button
            onClick={loadHistory}
            disabled={isLoadingHistory}
            className={`w-full px-4 py-2 rounded-lg disabled:opacity-50 
              ${isDarkMode 
                ? 'bg-gray-700 text-white hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}
          >
            {isLoadingHistory ? 'Loading History...' : 'Load More Comics'}
          </button>
        </div>

        {error && (
          <div className="text-red-500 mb-4">
            {error}
          </div>
        )}

        {panels.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {panels.map((panel, index) => (
              <div 
                key={index} 
                className={`border rounded-lg overflow-hidden ${
                  isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                }`}
              >
                <h3 className="font-bold p-4 text-lg">Panel {index + 1}</h3>
                {panel.imageUrl && (
                  <div className="aspect-w-16 aspect-h-12 w-full">
                    <img 
                      src={panel.imageUrl} 
                      alt={`Panel ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="p-4"><strong>Caption:</strong> {panel.caption}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Fixed dark mode button at the bottom center */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        <button
          onClick={toggleDarkMode}
          className={`px-6 py-3 rounded-full shadow-lg transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-700 text-white hover:bg-gray-600' 
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>
    </div>
  );
};

export default Home;