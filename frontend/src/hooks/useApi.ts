import { useCallback, useState } from "react";
import useSWR, { mutate } from "swr";
import { apiClient } from "../services/api";
import { BulkScrapeResponse, Media, MediaQueryParams, PaginatedResponse } from "../types";

/**
 * SWR fetcher functions for different API endpoints.
 */
const fetchers = {
  media: (params: MediaQueryParams) => apiClient.getMedia(params),
  mediaById: (id: string) => apiClient.getMediaById(id),
  mediaStats: () => apiClient.getMediaStats(),
  scrapeStatus: (id: string) => apiClient.getScrapeStatus(id),
  health: () => apiClient.healthCheck(),
};

/**
 * Generates cache keys for SWR.
 */
const createCacheKey = {
  media: (params: MediaQueryParams) => ["media", JSON.stringify(params)],
  mediaById: (id: string) => ["media", id],
  mediaStats: () => ["mediaStats"],
  scrapeStatus: (id: string) => ["scrapeStatus", id],
  health: () => ["health"],
};

/**
 * Hook for fetching paginated media with filters.
 * @param params - Query parameters for filtering and pagination
 */
export const useMedia = (params: MediaQueryParams = {}) => {
  const {
    data,
    error,
    isLoading,
    mutate: revalidate,
  } = useSWR<PaginatedResponse<Media>>(createCacheKey.media(params), () => fetchers.media(params), {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
  return {
    data,
    error,
    isLoading,
    refetch: revalidate,
  };
};

/**
 * Hook for fetching a single media item by ID.
 * @param id - The media ID
 */
export const useMediaById = (id: string) => {
  const { data, error, isLoading } = useSWR<Media>(
    id ? createCacheKey.mediaById(id) : null,
    () => fetchers.mediaById(id),
    {
      revalidateOnFocus: false,
    },
  );
  return { data, error, isLoading };
};

/**
 * Hook for fetching media statistics.
 */
export const useMediaStats = () => {
  const { data, error, isLoading } = useSWR<{ type: string; count: number }[]>(
    createCacheKey.mediaStats(),
    fetchers.mediaStats,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  );
  return { data, error, isLoading };
};

/**
 * Hook for deleting media with cache invalidation.
 */
export const useDeleteMedia = () => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutateAsync = useCallback(async (id: string): Promise<void> => {
    setIsPending(true);
    setError(null);
    try {
      await apiClient.deleteMedia(id);
      await mutate((key) => Array.isArray(key) && key[0] === "media", undefined, { revalidate: true });
      await mutate(createCacheKey.mediaStats(), undefined, { revalidate: true });
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to delete media");
      setError(errorObj);
      throw errorObj;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { mutateAsync, isPending, error };
};

/**
 * Hook for scraping URLs with cache invalidation.
 */
export const useScrapeUrls = () => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isError, setIsError] = useState(false);

  const mutateAsync = useCallback(async (urls: string[]): Promise<BulkScrapeResponse> => {
    setIsPending(true);
    setError(null);
    setIsError(false);
    try {
      const result = await apiClient.scrapeUrls(urls);
      await mutate((key) => Array.isArray(key) && key[0] === "media", undefined, { revalidate: true });
      await mutate(createCacheKey.mediaStats(), undefined, { revalidate: true });
      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to scrape URLs");
      setError(errorObj);
      setIsError(true);
      throw errorObj;
    } finally {
      setIsPending(false);
    }
  }, []);

  return { mutateAsync, isPending, error, isError };
};

/**
 * Hook for polling scrape status.
 * @param id - The scrape request ID
 */
export const useScrapeStatus = (id: string | null) => {
  const { data, error, isLoading } = useSWR(
    id ? createCacheKey.scrapeStatus(id) : null,
    () => fetchers.scrapeStatus(id!),
    {
      refreshInterval: 2000,
      revalidateOnFocus: false,
    },
  );
  return { data, error, isLoading };
};

/**
 * Hook for health check with periodic polling.
 */
export const useHealthCheck = () => {
  const { data, error, isLoading } = useSWR(createCacheKey.health(), fetchers.health, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
    refreshInterval: 30000,
  });
  return { data, error, isLoading };
};
