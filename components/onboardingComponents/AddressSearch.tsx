"use client";

import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Loader2, MapPin } from "lucide-react";

interface Location {
  name?: string;
  displayName?: string;
  address?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  lon?: number;
  longitude?: number;
  latitude?: number;
  [key: string]: unknown;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface AddressSearchProps {
  value: string;
  onChange: (val: string) => void;
  onCoordinates?: (coords: Coordinates) => void;
}

export const AddressSearch = ({
  value,
  onChange,
  onCoordinates,
}: AddressSearchProps) => {
  const [query, setQuery] = useState(value);
  const [locations, setLocations] = useState<Location[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 400);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Fetch locations when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setLocations([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(
      `/api/business/search-location?query=${encodeURIComponent(debouncedQuery)}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        console.log("Raw API response:", data);
        // The API may return data in different shapes
        const list: Location[] = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.locations)
              ? data.locations
              : Array.isArray(data.results)
                ? data.results
                : Array.isArray(data.addressSuggestions)
                  ? data.addressSuggestions
                  : data.data &&
                      typeof data.data === "object" &&
                      Array.isArray(data.data.data)
                    ? data.data.data
                    : [];
        console.log("Parsed locations list:", list);
        setLocations(list);
        if (list.length > 0) {
          setOpen(true);
        }
      })
      .catch((err) => {
        console.error("Search fetch error:", err);
        if (!cancelled) setLocations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (location: Location) => {
    const displayName =
      location.name || location.displayName || location.address || "";
    onChange(displayName);
    setQuery(displayName);
    setOpen(false);
    if (onCoordinates) {
      const lat = location.lat ?? location.latitude ?? 0;
      const lng = location.lng ?? location.lon ?? location.longitude ?? 0;
      if (lat && lng) {
        onCoordinates({ lat, lng });
      }
    }
  };

  return (
    <div className="mb-5 relative" ref={wrapperRef}>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-wide">
        Search address
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (locations.length > 0) setOpen(true);
          }}
          placeholder="Start typing your business address..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border-[1.5px] border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:bg-white"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 animate-spin" />
        )}
      </div>

      {open && locations.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {locations.map((loc, idx) => {
            const displayName =
              loc.name || loc.displayName || loc.address || "";
            return (
              <li
                key={loc.placeId || idx}
                onClick={() => handleSelect(loc)}
                className="px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors flex items-start gap-2 border-b border-slate-100 last:border-b-0"
              >
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                <span>{displayName}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
