import { Heart } from "lucide-react";
import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
          <p>
            Made with <Heart className="h-4 w-4 text-red-500 inline" /> for the Media Scraper project
          </p>
          <p>© {new Date().getFullYear()} Media Scraper</p>
        </div>
      </div>
    </footer>
  );
};
