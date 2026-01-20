import { Camera, Github } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export const Header: React.FC = () => {
  const [swapLink, setSwapLink] = useState("/");
  const [swapText, setSwapText] = useState("Media Page");
  useEffect(() => {
    if (window.location.pathname === "/media") {
      setSwapLink("/");
      setSwapText("Scraper Page");
    } else {
      setSwapLink("/media");
      setSwapText("Media Page");
    }
  });

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500 rounded-lg">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Media Scraper</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Scrape images and videos from any website</p>
            </div>
          </div>
          <div>
            <Link to={swapLink} onClick={() => setSwapLink("")} className="text-sm transition-colors">
              {swapText}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Mio1710/media-scraper"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
