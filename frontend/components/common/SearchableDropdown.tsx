import React, { useState, useRef, useEffect } from "react";
import "../../styles/SearchableDropdown.css";

interface SearchableDropdownProps {
  options: { id: string; name: string; subtitle?: string }[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  placeholder = "Select an option...",
  value,
  onChange,
  isLoading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search
  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(search.toLowerCase()) ||
    (opt.subtitle && opt.subtitle.toLowerCase().includes(search.toLowerCase()))
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative group">
        <input
          type="text"
          className="input-field w-full pr-10"
          placeholder={placeholder}
          value={isOpen ? search : (value || search)}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
            // If user types, we clear the selected value or just keep it as the search string
            onChange(e.target.value);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearch(""); // Clear search to show all on focus
          }}
        />
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-gh-text-secondary pointer-events-none dropdown-chevron ${isOpen ? 'open' : ''}`}>
          <span className="material-symbols-outlined text-[18px]">expand_more</span>
        </div>
      </div>

      {isOpen && (
        <div className="searchable-dropdown-overlay">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="dropdown-loading">
                <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading workspaces...
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    onChange(opt.name);
                    setSearch(opt.name);
                    setIsOpen(false);
                  }}
                >
                  <span className="dropdown-item-name">{opt.name}</span>
                  {opt.subtitle && (
                    <span className="dropdown-item-subtitle">{opt.subtitle}</span>
                  )}
                </button>
              ))
            ) : (
              <div className="dropdown-empty">
                <span className="material-symbols-outlined opacity-20 text-[32px] mb-2">search_off</span>
                <p className="text-xs">No workspaces matched "{search}"</p>
                <button 
                  className="mt-2 text-primary text-[11px] hover:underline font-bold"
                  onClick={() => {
                    onChange(search);
                    setIsOpen(false);
                  }}
                >
                  Use "{search}" anyway
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
