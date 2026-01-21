import { useScrapeHistory } from "@/hooks/scraper.swr";
import { ScrapeStatus } from "@/types";

import { AlertCircle, ImageIcon, Loader2, X } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import Pagination from "../Pagination";

const ScraperHistory: React.FC = () => {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<ScrapeStatus | "">("");

  const handleTypeFilterChange = useCallback((value: ScrapeStatus | ""): void => {
    setTypeFilter(value);
    setPage(1);
  }, []);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      status: typeFilter || undefined,
    }),
    [page, typeFilter],
  );

  const { data, pagination, isLoading, error, refetch } = useScrapeHistory(queryParams);
  const handleRetry = (): void => {
    refetch();
  };
  return (
    <div>
      <div className="flex flex-row-reverse my-2">
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => handleTypeFilterChange(e.target.value as ScrapeStatus | "")}
            className="block p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
            aria-label="Filter by media type"
          >
            <option value="">All Types</option>
            {Object.values(ScrapeStatus).map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {typeFilter && (
            <button
              onClick={() => {
                handleTypeFilterChange("");
              }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              aria-label="Clear all filters"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          <span className="ml-2 text-gray-500">Loading media...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 text-red-500">
          <AlertCircle className="h-12 w-12 mb-2" />
          <p className="text-lg font-medium">Failed to load media</p>
          <p className="text-sm text-gray-500 mb-4">{error.message}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            aria-label="Retry loading media"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && data?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <ImageIcon className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium">No media found</p>
          <p className="text-sm">{typeFilter ? "Try adjusting your filters" : "Start by scraping some URLs"}</p>
        </div>
      )}

      {/* Media Grid */}
      {!isLoading && !error && data && data.length > 0 && (
        <>
          <div className="flex flex-col gap-4">
            {data.map((media, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between">
                  <div>Source url: {media.sourceUrl}</div>
                  <div>{media.status}</div>
                </div>
                <div>Media Count: {media.mediaCount}</div>
                {media.errorMessage && <div className="text-red-500">Error: {media.errorMessage}</div>}
                <div>Started at: {media.updatedAt}</div>
              </div>
              // <MediaCard key={media.id} media={media} onDelete={handleDelete} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && <Pagination pagination={pagination} onPageChange={(newPage) => setPage(newPage)} />}
        </>
      )}
    </div>
  );
};

export default ScraperHistory;
