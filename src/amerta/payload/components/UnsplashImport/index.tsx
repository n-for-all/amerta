"use client";

import React, { useState, useEffect } from "react";
import { Drawer, DrawerToggler, useModal } from "@payloadcms/ui"; // Native Drawer
import { useListDrawerContext } from "@payloadcms/ui";
import { getAdminApiURL } from "@/amerta/utilities/getAdminURL";

const DRAWER_SLUG = "unsplash-import-drawer";

export const UnsplashImport = ({ collection }: { collection?: string }) => {
  const [query, setQuery] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { closeModal } = useModal();
  const { refresh } = useListDrawerContext();
  // --- 1. DEBOUNCED SEARCH ---
  useEffect(() => {
    // Don't search if empty
    if (!query) {
      setImages([]);
      return;
    }

    // Set a delay (500ms)
    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(getAdminApiURL(`/media-stock/search?q=${query}`));
        const data = await res.json();
        setImages(data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    // Cleanup: If user types again before 500ms, cancel the previous timer
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // --- 2. IMPORT HANDLER ---
  const handleImport = async (photo: any) => {
    setIsLoading(true);
    try {
      await fetch(getAdminApiURL(`/media-stock/import`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          imageUrl: photo.urls.regular,
          collection: collection,
          alt: photo.alt_description,
          photographer: photo.user.name,
        }),
      });

      // Close Drawer using the Slug
      closeModal(DRAWER_SLUG);

      // Reset State
      setQuery("");
      setImages([]);

      refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* 3. TRIGGER BUTTON */}
      <DrawerToggler slug={DRAWER_SLUG} className="btn btn--style-secondary btn--size-small">
        + Import Stock Photo
      </DrawerToggler>

      {/* 4. THE DRAWER UI */}
      <Drawer slug={DRAWER_SLUG} title="Search Unsplash" className="unsplash-drawer">
        <div style={{ padding: "0 0px 40px" }}>
          {/* Search Input */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold" }}>Search Query</label>
            <input
              autoFocus
              type="text"
              placeholder="Type to search (e.g. 'Coffee')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="form-control" // Uses Payload's default input style class if available
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid var(--theme-elevation-200)",
                background: "var(--theme-elevation-50)",
                color: "var(--theme-elevation-800)",
                borderRadius: "4px",
                fontSize: "16px",
              }}
            />
          </div>

          {/* Loading State */}
          {isLoading && <p style={{ color: "#888" }}>Loading...</p>}

          {/* Results Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            {images.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => handleImport(img)}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  position: "relative",
                  borderRadius: "0px",
                  overflow: "hidden",
                  aspectRatio: "1 / 1", // Keeps tiles square
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <img
                  src={img.urls.small}
                  alt={img.alt_description}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                />

                {/* Photographer Credit Overlay */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "8px",
                    background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                    color: "white",
                    fontSize: "12px",
                  }}
                >
                  {img.user.name}
                </div>
              </button>
            ))}
          </div>

          {!isLoading && query && images.length === 0 && <p style={{ marginTop: "20px", color: "#666" }}>No results found.</p>}
        </div>
      </Drawer>
    </div>
  );
};

export const UnsplashImportProductMedia = () => {
  return <UnsplashImport collection="product-media" />;
};
