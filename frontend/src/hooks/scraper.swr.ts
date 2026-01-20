import { ScraperService } from "@/services/scraper";
import { BulkScrapeResponse } from "@/types";
import { useCallback, useState } from "react";
import useSWR from "swr";
import { mutate } from "swr/_internal";

export const useScrapeUrls = () => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isError, setIsError] = useState(false);

  const mutateAsync = useCallback(async (urls: string[]): Promise<BulkScrapeResponse> => {
    setIsPending(true);
    setError(null);
    setIsError(false);
    try {
      const result = await ScraperService.scrapeUrls(urls);
      await mutate((key) => Array.isArray(key) && key[0] === "media", undefined, { revalidate: true });
      await mutate(["mediaStats"], undefined, { revalidate: true });
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

export const useScrapeStatus = (id: string | null) => {
  const { data, error, isLoading } = useSWR(
    id ? ["scrapeStatus", id] : null,
    () => ScraperService.getScrapeStatus(id!),
    {
      refreshInterval: 2000,
      revalidateOnFocus: false,
    },
  );
  return { data, error, isLoading };
};
