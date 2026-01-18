import React from "react";
import { SWRConfig } from "swr";
import { Footer, Header, MediaGallery, ScrapeForm } from "./components";

const App: React.FC = () => {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: true,
        errorRetryCount: 2,
        dedupingInterval: 30000,
      }}
    >
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Header />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Scrape Form */}
            <ScrapeForm />

            {/* Media Gallery */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Media Gallery</h2>
              <MediaGallery />
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </SWRConfig>
  );
};

export default App;
