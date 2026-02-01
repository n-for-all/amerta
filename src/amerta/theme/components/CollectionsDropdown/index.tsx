'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Collection } from '@/payload-types';
import { getURL } from '@/amerta/utilities/getURL';
import { useEcommerce } from '@/amerta/theme/providers/EcommerceProvider';

interface CollectionsDropdownProps {
  collections: Collection[];
}

export default function CollectionsDropdown({ collections }: CollectionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);
  const { locale, __ } = useEcommerce();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  if (!collections || collections.length === 0) {
    return (
      <li>
        <div className="flex items-center gap-x-2">
          <a className="uppercase text-zinc-900" href={getURL("/collections", locale)}>
            {__("Collections")}
          </a>
          <svg viewBox="0 0 6 20" aria-hidden="true" className="w-auto h-5 text-zinc-300">
            <path d="M4.878 4.34H3.551L.27 16.532h1.327l3.281-12.19z" fill="currentColor"></path>
          </svg>
        </div>
      </li>
    );
  }

  if(collections.length === 1) {
    const collection = collections[0]!;
    return (
      <li>
        <div className="flex items-center gap-x-2">
          <a className="uppercase text-zinc-900" href={`/en/collections/${collection.slug || collection.id}`}>
            {collection.title}
          </a>
          <svg viewBox="0 0 6 20" aria-hidden="true" className={`w-auto h-5 text-zinc-300 transition-transform ${isOpen ? 'rotate-90' : ''}`}>
            <path d="M4.878 4.34H3.551L.27 16.532h1.327l3.281-12.19z" fill="currentColor"></path>
          </svg>
        </div>
      </li>
    );
  }

  return (
    <li ref={dropdownRef}>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center uppercase transition-colors gap-x-2 text-zinc-900 hover:text-zinc-700"
        >
          {__("Collections")}
          <svg viewBox="0 0 6 20" aria-hidden="true" className={`w-auto h-5 text-zinc-300 transition-transform ${isOpen ? 'rotate-90' : ''}`}>
            <path d="M4.878 4.34H3.551L.27 16.532h1.327l3.281-12.19z" fill="currentColor"></path>
          </svg>
        </button>

        {isOpen && (
          <div className="absolute left-0 z-50 mt-2 overflow-auto bg-white border rounded-lg shadow-lg max-h-60 top-full border-zinc-200">
            <a
              href={getURL("/collections", locale)}
              className="block px-4 py-2 text-xs uppercase whitespace-nowrap text-zinc-900 hover:bg-zinc-100 first:rounded-t-lg"
              onClick={() => setIsOpen(false)}
            >
              {__("All Collections")}
            </a>
            {collections.map((collection) => (
              <a
                key={collection.id}
                href={getURL(`/collections/${collection.slug || collection.id}`, locale)}
                className="block px-4 py-2 text-xs uppercase whitespace-nowrap text-zinc-900 hover:bg-zinc-100"
                onClick={() => setIsOpen(false)}
              >
                {collection.title}
              </a>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
