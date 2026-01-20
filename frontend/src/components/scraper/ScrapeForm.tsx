import { useScrapeUrls } from "@/hooks/scraper.swr";
import { CheckCircle, Link as LinkIcon, Loader2, Plus, X, XCircle } from "lucide-react";
import React, { useCallback, useState } from "react";
import { ScrapeJobResult, ScrapeStatus } from "../../types";

interface UrlInput {
  readonly id: number;
  readonly value: string;
}

export const ScrapeForm: React.FC = () => {
  const [urls, setUrls] = useState<UrlInput[]>([{ id: 1, value: "" }]);
  const [results, setResults] = useState<ScrapeJobResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const scrapeUrls = useScrapeUrls();

  const handleAddUrl = useCallback((): void => {
    setUrls((prev) => [...prev, { id: Date.now(), value: "" }]);
  }, []);

  const handleRemoveUrl = useCallback((id: number): void => {
    setUrls((prev) => {
      if (prev.length === 1) {
        return prev;
      }
      return prev.filter((url) => url.id !== id);
    });
  }, []);

  const handleUpdateUrl = useCallback((id: number, value: string): void => {
    setUrls((prev) => prev.map((url) => (url.id === id ? { ...url, value } : url)));
  }, []);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const validUrls = urls
      .map((u) => u.value.trim())
      .filter((u) => u && (u.startsWith("http://") || u.startsWith("https://")));

    if (validUrls.length === 0) {
      alert("Please enter at least one valid URL (starting with http:// or https://)");
      return;
    }

    try {
      const response = await scrapeUrls.mutateAsync(validUrls);
      setResults(response.results);
      setShowResults(true);
    } catch (error) {
      console.error("Scraping failed:", error);
    }
  };

  const handlePasteMultiple = useCallback((e: React.ClipboardEvent): void => {
    const pastedText = e.clipboardData.getData("text");
    const pastedUrls = pastedText
      .split(/[\n\r\s,]+/)
      .filter((url) => url.startsWith("http://") || url.startsWith("https://"));

    if (pastedUrls.length > 1) {
      e.preventDefault();
      setUrls(pastedUrls.map((url, index) => ({ id: Date.now() + index, value: url })));
    }
  }, []);

  const handleHideResults = (): void => {
    setShowResults(false);
  };

  const getStatusIcon = (status: ScrapeStatus): React.ReactNode => {
    switch (status) {
      case ScrapeStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case ScrapeStatus.FAILED:
        return <XCircle className="h-5 w-5 text-red-500" />;
      case ScrapeStatus.PROCESSING:
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-300" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <LinkIcon className="h-5 w-5 text-primary-500" />
        Scrape URLs
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          {urls.map((url, index) => (
            <div key={url.id} className="flex gap-2">
              <input
                type="url"
                value={url.value}
                onChange={(e) => handleUpdateUrl(url.id, e.target.value)}
                onPaste={index === 0 ? handlePasteMultiple : undefined}
                placeholder="https://example.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={scrapeUrls.isPending}
                aria-label={`URL input ${index + 1}`}
              />
              {urls.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveUrl(url.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={scrapeUrls.isPending}
                  aria-label={`Remove URL ${index + 1}`}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAddUrl}
            className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={scrapeUrls.isPending}
            aria-label="Add another URL input"
          >
            <Plus className="h-4 w-4" />
            Add URL
          </button>

          <button
            type="submit"
            disabled={scrapeUrls.isPending}
            className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {scrapeUrls.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scraping...
              </>
            ) : (
              "Start Scraping"
            )}
          </button>
        </div>

        <p className="text-sm text-gray-500">Tip: Paste multiple URLs (one per line) to add them all at once.</p>
      </form>

      {/* Error Message */}
      {scrapeUrls.isError && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          <p className="font-medium">Scraping Failed</p>
          <p className="text-sm">{scrapeUrls.error?.message}</p>
        </div>
      )}

      {/* Results */}
      {showResults && results.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Scraping Results</h3>
            <button
              onClick={handleHideResults}
              className="text-sm text-gray-500 hover:text-gray-700"
              aria-label="Hide scraping results"
            >
              Hide
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((result) => (
              <div key={result.requestId} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {getStatusIcon(result.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{result.sourceUrl}</p>
                  <p className="text-xs text-gray-500">
                    {result.status === ScrapeStatus.COMPLETED
                      ? `Found ${result.mediaCount} media items`
                      : result.status === ScrapeStatus.FAILED
                        ? result.errorMessage
                        : "Processing..."}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-sm text-gray-500">
            Total: {results.length} URLs processed | {results.filter((r) => r.status === ScrapeStatus.COMPLETED).length}{" "}
            successful | {results.reduce((sum, r) => sum + r.mediaCount, 0)} media items found
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrapeForm;
