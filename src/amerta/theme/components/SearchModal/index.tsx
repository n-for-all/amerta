"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/amerta/theme/utilities/format-price";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { printf } from "fast-printf";
import { getURL } from "@/amerta/utilities/getURL";
interface SearchResult {
  products: any[];
  articles: any[];
  collections: any[];
  categories: any[];
  total_results: number;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export const SearchModal = ({ isOpen, onClose, locale }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { __, currency, exchangeRate } = useEcommerce();

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      const saved = localStorage.getItem("recent_searches");
      if (saved) setRecentSearches(JSON.parse(saved));
    }
  }, [isOpen]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
          const res = await fetch(`/api/live-search?q=${encodeURIComponent(query)}&locale=${locale}`);
          const data = await res.json();
          setResults(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, locale]);

  const handleSaveRecent = (text: string) => {
    const updated = [text, ...recentSearches.filter((t) => t !== text)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recent_searches", JSON.stringify(updated));
    onClose();
  };

  const removeRecent = (text: string) => {
    const updated = recentSearches.filter((t) => t !== text);
    setRecentSearches(updated);
    localStorage.setItem("recent_searches", JSON.stringify(updated));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col bg-black/20 backdrop-blur-[4px] p-4 cursor-auto" onClick={onClose}>
      {/* Container */}
      <div className="mx-auto flex w-full md:max-w-[50vw] min-w-[320px] flex-col rounded bg-white shadow-lg dark:bg-[#1c1c1c] dark:text-white/70 overflow-hidden max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative z-10 flex flex-none items-center border-b border-zinc-200 px-4 py-1 dark:border-[#383838]">
          <label className="mr-3 text-zinc-500 dark:text-white/50 rtl:ml-3 rtl:mr-0">
            <Search className="w-5 h-5" />
          </label>
          <div className="relative w-full">
            <input ref={inputRef} type="text" className="w-full h-10 text-lg bg-transparent text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-white dark:placeholder-white/30" placeholder={__("Search...")} value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
          </div>
          {loading && <Loader2 className="w-5 h-5 ml-2 text-zinc-400 animate-spin" />}
          {query && (
            <button onClick={() => setQuery("")} className="ml-2 text-zinc-400 hover:text-zinc-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {/* No Input & No Results */}
          {!query && recentSearches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-5 opacity-50">
              <span className="text-[15px] font-medium">{__("No Recent Searches")}</span>
              <span className="text-xs">{__("Type anything to start a new search")}</span>
            </div>
          )}

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <section className="mb-4">
              <h3 className="mb-2 text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-white/50">{__("Recent")}</h3>
              <ul className="space-y-1">
                {recentSearches.map((term, idx) => (
                  <li key={idx} className="relative group">
                    <button
                      onClick={() => {
                        setQuery(term);
                      }}
                      className="flex w-full items-center justify-between rounded bg-zinc-50 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:bg-[#242424] dark:text-white/70 dark:hover:bg-[#2f2f2f]"
                    >
                      <span>{term}</span>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecent(term);
                        }}
                        className="p-1 transition-opacity opacity-0 hover:text-red-500 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Actual Results */}
          {results && (
            <div className="space-y-6">
              {/* Categories / Collections */}
              {results.collections && results.collections.length > 0 ? (
                <section>
                  <h3 className="mb-2 text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-white/50">{__("Collections")}</h3>
                  <ul className="space-y-1">
                    {results.collections.map((col) => (
                      <li key={col.id}>
                        <Link href={col.url} onClick={() => handleSaveRecent(col.title)} className="flex items-center justify-between rounded bg-zinc-50 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:bg-[#242424] dark:text-white/70 dark:hover:bg-[#2f2f2f]">
                          <span dangerouslySetInnerHTML={{ __html: highlightMatch(col.title, query) }} />
                          <ArrowRight className="h-3.5 w-3.5 opacity-50 rtl:rotate-180" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {/* Products (Horizontal Slider Style) */}
              {results.products && results.products.length > 0 ? (
                <section>
                  <h3 className="mb-2 text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-white/50">{__("Products")}</h3>
                  <div className="flex gap-4 pb-4 overflow-x-auto custom-scrollbar">
                    {results.products.map((prod) => (
                      <Link key={prod.id} href={prod.url} onClick={() => handleSaveRecent(prod.title)} className="group relative flex w-[180px] flex-none flex-col rounded bg-white shadow-sm transition hover:shadow-md dark:bg-[#242424]">
                        <div className="relative h-[180px] w-full bg-white p-2">
                          {/* Replace with Next/Image in production */}
                          <img src={prod.image} alt={prod.title} className="object-contain w-full h-full" />
                          {/* Tags */}
                          {prod.discount_in_percentage > 0 && <span className="absolute left-0 top-0 -translate-x-[30px] -translate-y-[6px] -rotate-45 bg-[#45c0b6] px-8 py-1 text-[10px] text-white">Sale</span>}
                        </div>

                        <div className="flex flex-col flex-1 p-2">
                          <h4 className="line-clamp-2 min-h-[40px] text-[13px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
                            <span dangerouslySetInnerHTML={{ __html: highlightMatch(prod.title, query) }} />
                          </h4>

                          <div className="flex items-end justify-between pt-2 mt-auto">
                            <div className="flex flex-col">
                              <span className="font-semibold text-zinc-900 dark:text-white">{formatPrice(prod.price, currency, exchangeRate)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {results.categories && results.categories.length > 0 ? (
                <section>
                  <h3 className="mb-2 text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-white/50">{__("Categories")}</h3>
                  <ul className="space-y-1">
                    {results.categories.map((col) => (
                      <li key={col.id}>
                        <Link href={col.url} onClick={() => handleSaveRecent(col.title)} className="flex items-center justify-between rounded bg-zinc-50 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:bg-[#242424] dark:text-white/70 dark:hover:bg-[#2f2f2f]">
                          <span dangerouslySetInnerHTML={{ __html: highlightMatch(col.title, query) }} />
                          <ArrowRight className="h-3.5 w-3.5 opacity-50 rtl:rotate-180" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {/* Articles / Blog */}
              {results.articles && results.articles.length > 0 ? (
                <section>
                  <h3 className="mb-2 text-xs font-semibold tracking-wider uppercase text-zinc-500 dark:text-white/50">{__("Articles")}</h3>
                  <ul className="space-y-1">
                    {results.articles.map((art) => (
                      <li key={art.id}>
                        <Link href={art.url} onClick={() => handleSaveRecent(art.title)} className="flex items-center justify-between rounded bg-zinc-50 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:bg-[#242424] dark:text-white/70 dark:hover:bg-[#2f2f2f]">
                          <span dangerouslySetInnerHTML={{ __html: highlightMatch(art.title, query) }} />
                          <ArrowRight className="h-3.5 w-3.5 opacity-50 rtl:rotate-180" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {/* No results state */}
              {results.total_results === 0 && (
                <div className="flex flex-col items-center justify-center py-5">
                  <span className="text-[15px] font-medium opacity-80" dangerouslySetInnerHTML={{ __html: printf(__("No results found for %s"), `<b>${query}</b>`) }}></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 dark:border-[#383838]">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{results && results.total_results > 0 ? <span dangerouslySetInnerHTML={{ __html: printf(__("%s results found"), `<b>${results.total_results}</b>`) }}></span> : <span>{__("Type to search")}</span>}</div>

          {/* Navigation Hints */}
          <div className="items-center hidden gap-3 md:flex">
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-sans text-[10px] dark:border-zinc-700 dark:bg-zinc-800">↑</kbd>
              <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-sans text-[10px] dark:border-zinc-700 dark:bg-zinc-800">↓</kbd>
              <span>{__("to navigate")}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-sans text-[10px] dark:border-zinc-700 dark:bg-zinc-800">ESC</kbd>
              <span>{__("to close")}</span>
            </div>
          </div>

          {/* Show More Link */}
          {results && results.total_results > 0 && (
            <Link href={getURL(`/search?q=${query}`, locale)} className="flex items-center text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
              <span dangerouslySetInnerHTML={{ __html: __("Show more &rarr;") }}></span>
            </Link>
          )}
        </footer>
      </div>
    </div>
  );
};

// Helper to highlight search terms
function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, '<mark class="bg-transparent text-sky-600 border-b-2 border-sky-300">$1</mark>');
}
