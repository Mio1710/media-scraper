import { Search, X } from "lucide-react";
import React from "react";
import { MediaType } from "../types";

interface SearchAndFilterProps {
  readonly search: string;
  readonly onSearchChange: (value: string) => void;
  readonly typeFilter: MediaType | "";
  readonly onTypeFilterChange: (value: MediaType | "") => void;
  readonly onClear: () => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  onClear,
}) => {
  const hasFilters = search || typeFilter;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(e.target.value);
  };

  const handleTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onTypeFilterChange(e.target.value as MediaType | "");
  };

  const handleClearFilters = (): void => {
    onClear();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search Input */}
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by title, alt text, or URL..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          aria-label="Search media by title, alt text, or URL"
        />
      </div>

      {/* Type Filter */}
      <div className="flex gap-2">
        <select
          value={typeFilter}
          onChange={handleTypeFilterChange}
          className="block px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
          aria-label="Filter by media type"
        >
          <option value="">All Types</option>
          <option value={MediaType.IMAGE}>Images</option>
          <option value={MediaType.VIDEO}>Videos</option>
        </select>

        {/* Clear Filters */}
        {hasFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchAndFilter;
