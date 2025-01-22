'use client'
import { useState, useEffect } from "react";

interface ComicPanel {
  prompt: string;
  caption: string;
  imageUrl: string;
}

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  // const [comicPanels, setComicPanels] = useState<ComicPanel[]>([]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    
    try {
      const response = await fetch('/api/generate/generate_img', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: inputText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else {
        throw new Error('No image URL in response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container">
      {/* Title and Description */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Foley Comic Generator</h1>
        <p className="text-gray-700 dark:text-gray-300">
          Enter your prompt below and click submit to generate a comic featuring Foley, 
          a charming black chihuahua. Your story will come to life in a series of 
          comic panels starring our tiny hero!
        </p>
      </div>

      {/* Centered Content */}
      <div className="space-y-4">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter your text here..."
          rows={6}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center resize-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent outline-none transition-all"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-gray-700 dark:bg-gray-300 text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Submit'}
        </button>

        {error && (
          <p className="text-red-500 text-center mt-4">{error}</p>
        )}

        {generatedImage && (
          <div className="mt-8 flex justify-center">
            <div className="max-w-2xl w-full">
              <img
                src={generatedImage}
                alt="Generated Foley comic"
                className="rounded-lg shadow-lg w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Comic Panels Display
        {comicPanels.length > 0 && (
          <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comicPanels.map((panel, index) => (
                <div key={index} className="flex flex-col items-center">
                  <img
                    src={panel.imageUrl}
                    alt={`Comic panel ${index + 1}`}
                    className="rounded-lg shadow-lg max-w-full h-auto"
                  />
                  <p className="mt-2 text-center text-sm">{panel.caption}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div> */}

      {/* Dark Mode Toggle */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="px-4 py-2 bg-gray-700 dark:bg-gray-300 text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </main>
  );
}