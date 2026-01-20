import { useScrapeHistory } from "@/hooks/scraper.swr";
import { ScrapeStatus } from "@/types";

import { AlertCircle, ImageIcon, Loader2 } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import Pagination from "../Pagination";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

const ScraperHistory: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ScrapeStatus | "">("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const limit = 20;

  // Debounce search
  const debounceTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string): void => {
    setSearch(value);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  }, []);

  const handleTypeFilterChange = useCallback((value: ScrapeStatus | ""): void => {
    setTypeFilter(value);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback((): void => {
    setSearch("");
    setDebouncedSearch("");
    setTypeFilter("");
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number): void => {
    setPage(newPage);
  }, []);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      type: typeFilter || undefined,
      search: debouncedSearch || undefined,
    }),
    [page, typeFilter, debouncedSearch],
  );

  const { data, isLoading, error, refetch } = useScrapeHistory(queryParams);
  const handleRetry = (): void => {
    refetch();
  };
  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* <SearchAndFilter
        search={search}
        onSearchChange={handleSearchChange}
        typeFilter={typeFilter}
        onTypeFilterChange={handleTypeFilterChange}
        onClear={handleClearFilters}
      /> */}

      {/* Loading State */}
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
      {!isLoading && !error && data?.data?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <ImageIcon className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium">No media found</p>
          <p className="text-sm">
            {debouncedSearch || typeFilter ? "Try adjusting your filters" : "Start by scraping some URLs"}
          </p>
        </div>
      )}

      {/* Media Grid */}
      {!isLoading && !error && data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.data.map((media) => (
              <>{media.sourceUrl}</>
              // <MediaCard key={media.id} media={media} onDelete={handleDelete} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination pagination={data.pagination} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
};

export default ScraperHistory;
