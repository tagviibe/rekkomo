"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { HiOutlineMapPin } from "react-icons/hi2";

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: "city" | "state" | "locality";
  className?: string;
  wrapperClassName?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
}

export default function PlacesAutocomplete({
  value,
  onChange,
  onBlur,
  placeholder = "Search location...",
  type = "city",
  className = "",
  wrapperClassName = "",
  id,
  name,
  disabled = false,
}: PlacesAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Array<{ value: string; label: string }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query || query.trim().length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `/api/geo/places?type=${type}&q=${encodeURIComponent(query.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          const items = (data.items ?? []).map((item: { value: string; label?: string }) => ({
            value: item.value,
            label: item.label || item.value,
          }));
          setSuggestions(items);
          setShowDropdown(items.length > 0);
          setHighlightedIndex(-1);
        }
      } catch (error) {
        console.error("Failed to fetch places:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [type]
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (suggestion: { value: string; label: string }) => {
    onChange(suggestion.value);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${wrapperClassName}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowDropdown(true);
            }
          }}
          onBlur={() => {
            // Delay to allow click on suggestion
            setTimeout(() => {
              setShowDropdown(false);
              onBlur?.();
            }, 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-500 ${className}`}
          autoComplete="off"
        />
        <HiOutlineMapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {showDropdown && (suggestions.length > 0 || loading) && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-500">Searching...</div>
          ) : (
            <ul className="max-h-60 overflow-y-auto py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion.value}-${index}`}
                  onClick={() => handleSelect(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`cursor-pointer px-4 py-2.5 text-sm transition-colors ${
                    highlightedIndex === index
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <HiOutlineMapPin className="h-4 w-4 flex-shrink-0 text-slate-400" />
                    <span className="truncate">{suggestion.label}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
