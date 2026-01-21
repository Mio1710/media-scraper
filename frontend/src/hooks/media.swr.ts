import { MediaService } from "@/services/media";
import { Media, MediaType, PaginatedResponse } from "@/types";
import { useCallback, useState } from "react";
import useSWR, { mutate } from "swr";
// Query Parameters
export interface MediaQueryParams {
  page?: number;
  limit?: number;
  type?: MediaType;
  search?: string;
  sourceUrl?: string;
}

export const useMediaSWR = (params: MediaQueryParams = {}) => {
  const {
    data,
    error,
    isLoading,
    mutate: revalidate,
  } = useSWR<PaginatedResponse<Media[]>>(["media", params], () => MediaService.getMedia(params), {
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

export const useMediaByID = (id: string) => {
  const { data, error, isLoading } = useSWR<Media>(id ? ["media", id] : null, () => MediaService.getMediaById(id), {
    revalidateOnFocus: false,
  });
  return { data, error, isLoading };
};

export const useMediaStats = () => {
  const { data, error, isLoading } = useSWR<{ type: string; count: number }[]>(
    ["mediaStats"],
    () => MediaService.getMediaStats(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  );
  return { data, error, isLoading };
};

export const useDeleteMedia = () => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutateAsync = useCallback(async (id: string): Promise<void> => {
    setIsPending(true);
    setError(null);
    try {
      await MediaService.deleteMedia(id);
      await mutate((key) => Array.isArray(key) && key[0] === "media", undefined, { revalidate: true });
      await mutate(["mediaStats"], undefined, { revalidate: true });
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
