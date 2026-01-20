import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import { Pagination as PaginationType } from "../types";

interface PaginationProps {
  readonly pagination: PaginationType;
  readonly onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ pagination, onPageChange }) => {
  const { page, totalPages, totalItems } = pagination;

  const handlePrevPage = (): void => {
    onPageChange(page - 1);
  };

  const handleNextPage = (): void => {
    onPageChange(page + 1);
  };

  const handlePageClick = (pageNum: number): void => {
    onPageChange(pageNum);
  };

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) {
    return (
      <div className="text-center text-gray-500 text-sm py-4">
        Showing {totalItems} item{totalItems !== 1 ? "s" : ""}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="text-sm text-gray-500">
        Page {page} of {totalPages} ({totalItems} items)
      </div>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        {/* Previous Button */}
        <button
          onClick={handlePrevPage}
          disabled={page === 1}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page Numbers */}
        {getPageNumbers().map((pageNum, index) => (
          <React.Fragment key={index}>
            {pageNum === "..." ? (
              <span className="px-3 py-2 text-gray-400" aria-hidden="true">
                ...
              </span>
            ) : (
              <button
                onClick={() => handlePageClick(pageNum as number)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pageNum === page ? "bg-primary-500 text-white" : "border border-gray-300 hover:bg-gray-50"
                }`}
                aria-label={`Go to page ${pageNum}`}
                aria-current={pageNum === page ? "page" : undefined}
              >
                {pageNum}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* Next Button */}
        <button
          onClick={handleNextPage}
          disabled={page >= totalPages}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
