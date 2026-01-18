import { AlertCircle, Image as ImageIcon, Loader2, Video } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useDeleteMedia, useMedia, useMediaStats } from "../hooks/useApi";
import { MediaType } from "../types";
import { MediaCard } from "./MediaCard";
import { Pagination } from "./Pagination";
import { SearchAndFilter } from "./SearchAndFilter";

export const MediaGallery: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaType | "">("");
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

  const handleTypeFilterChange = useCallback((value: MediaType | ""): void => {
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

  const { data, isLoading, error, refetch } = useMedia(queryParams);
  const { data: stats } = useMediaStats();
  const deleteMedia = useDeleteMedia();

  const handleDelete = useCallback(
    async (id: string): Promise<void> => {
      if (window.confirm("Are you sure you want to delete this media?")) {
        try {
          await deleteMedia.mutateAsync(id);
        } catch (err) {
          console.error("Failed to delete media:", err);
        }
      }
    },
    [deleteMedia],
  );

  const handleRetry = (): void => {
    refetch();
  };

  const imageCount = stats?.find((s) => s.type === MediaType.IMAGE)?.count ?? 0;
  const videoCount = stats?.find((s) => s.type === MediaType.VIDEO)?.count ?? 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <ImageIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Images</p>
            <p className="text-2xl font-semibold text-gray-900">{imageCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <Video className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Videos</p>
            <p className="text-2xl font-semibold text-gray-900">{videoCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <ImageIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Media</p>
            <p className="text-2xl font-semibold text-gray-900">{imageCount + videoCount}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <SearchAndFilter
          search={search}
          onSearchChange={handleSearchChange}
          typeFilter={typeFilter}
          onTypeFilterChange={handleTypeFilterChange}
          onClear={handleClearFilters}
        />

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
        {!isLoading && !error && data?.data.length === 0 && (
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
                <MediaCard key={media.id} media={media} onDelete={handleDelete} />
              ))}
            </div>

            {/* Pagination */}
            <Pagination pagination={data.pagination} onPageChange={handlePageChange} />
          </>
        )}
      </div>
    </div>
  );
};

export default MediaGallery;
