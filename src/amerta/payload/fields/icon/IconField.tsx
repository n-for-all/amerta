"use client";
import * as React from "react";
import { Button, TextInput, useField, useModal } from "@payloadcms/ui";
import { Drawer } from "@/amerta/components/Drawer/Drawer";
import "./index.scss";
import { useCallback, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { DynamicIcon } from "@/amerta/components/Icon/DynamicIcon";

interface IconData {
  name: string;
  title: string;
  fileName: string;
}

const ITEMS_PER_BATCH = 50;

export const IconField: React.FC<{ path: string; label: string }> = ({ path, label }) => {
  const { value: fieldValue, setValue: setFieldValue } = useField<string>({ path });
  const [searchValue, setSearchValue] = React.useState<string>("");
  const { openModal, closeModal } = useModal();
  const [allIcons, setAllIcons] = React.useState<IconData[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [displayedCount, setDisplayedCount] = React.useState(ITEMS_PER_BATCH);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Filter icons based on search
  const filteredIcons = React.useMemo(() => {
    if (!searchValue || searchValue.trim() === "") {
      return allIcons;
    }
    const searchTerm = searchValue.toLowerCase();
    return allIcons.filter((icon) => icon.name.toLowerCase().includes(searchTerm) || icon.title.toLowerCase().includes(searchTerm));
  }, [allIcons, searchValue]);

  // Get currently displayed icons
  const displayedIcons = filteredIcons.slice(0, displayedCount);
  const hasMore = displayedCount < filteredIcons.length;

  // Reset displayed count when search changes
  React.useEffect(() => {
    setDisplayedCount(ITEMS_PER_BATCH);
  }, [searchValue]);

  // Load more icons
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    // Simulate a small delay to show loading state
    setTimeout(() => {
      setDisplayedCount((prev) => Math.min(prev + ITEMS_PER_BATCH, filteredIcons.length));
      setIsLoadingMore(false);
    }, 100);
  }, [isLoadingMore, hasMore, filteredIcons.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      {
        rootMargin: "100px", // Load more when sentinel is 100px from viewport
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
    };
  }, [loadMore, hasMore, isLoadingMore]);

  // Fetch icons from the API endpoint
  const fetchIcons = React.useCallback(async () => {
    if (allIcons.length > 0) return; // Already loaded

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/fields/icons", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch icons: ${response.statusText}`);
      }

      const data = await response.json();
      setAllIcons(data);
    } catch (err) {
      console.error("Error fetching icons:", err);
      setError(err instanceof Error ? err.message : "Failed to load icons");
    } finally {
      setLoading(false);
    }
  }, [allIcons.length]);

  // Fetch icons when modal is opened
  const handleOpenModal = () => {
    fetchIcons();
    openModal("icon-select" + path);
  };

  const handleSelectIcon = (iconName: string) => {
    setFieldValue(iconName);
    closeModal("icon-select");
  };

  const handleSearchChange = (e) => {
    if (!e.target.value) return true;
    const searchTerm = e.target.value.toLowerCase();
    setSearchValue(searchTerm);
    return true;
  };

  return (
    <div className="icon-field">
      {label ? <label className="field-label">{label}</label> : null}
      <div className="icon-field__header">
        <Button tooltip="Select an icon" onClick={handleOpenModal} disabled={loading}>
          {loading ? (
            "Loading..."
          ) : fieldValue ? (
            <DynamicIcon className="icon-field__item-icon" name={fieldValue} />
          ) : (
            <>
              <Plus style={{ height: "16px" }} /> Icon
            </>
          )}
        </Button>
        <TextInput path={path} value={fieldValue} style={{ display: "none" }} readOnly />
      </div>

      {error && <div className="icon-field__error">{error}</div>}

      <Drawer title={"Select an icon"} gutter={false} slug={"icon-select" + path} onClose={(slug) => closeModal(slug)}>
        <div className="icon-field__drawer">
          <TextInput placeholder="Search icons..." value={searchValue} path={path + "-search"} onChange={handleSearchChange} />

          {loading && (
            <div className="icon-field__loading">
              <div className="icon-field__spinner"></div>
              <p>Loading icons...</p>
            </div>
          )}

          {error && (
            <div className="icon-field__error-state">
              <p>{error}</p>
              <Button onClick={fetchIcons} className="icon-field__retry">
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && allIcons.length > 0 && (
            <>
              <div className="icon-field__count">
                <p>
                  Showing {displayedIcons.length} of {filteredIcons.length} icons
                  {searchValue && ` (filtered from ${allIcons.length} total)`}
                </p>
              </div>

              <div className="icon-field__grid" ref={gridRef}>
                {displayedIcons.map((icon) => (
                  <button key={icon.name} onClick={() => handleSelectIcon(icon.name)} className={`icon-field__item ${fieldValue === icon.name ? "icon-field__item--selected" : ""}`}>
                    <DynamicIcon className="icon-field__item-icon" name={icon.name} />
                    <div>
                      <div className="icon-field__item-title">{icon.title}</div>
                      <div className="icon-field__item-name">{icon.name}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Sentinel element for infinite scroll */}
              <div ref={sentinelRef} className="icon-field__sentinel" />

              {isLoadingMore && (
                <div className="icon-field__loading-more">
                  <div className="icon-field__spinner"></div>
                  <p>Loading more icons...</p>
                </div>
              )}

              {!hasMore && filteredIcons.length > ITEMS_PER_BATCH && (
                <div className="icon-field__end">
                  <p>All icons loaded ({filteredIcons.length} total)</p>
                </div>
              )}
            </>
          )}

          {!loading && !error && allIcons.length === 0 && <div className="icon-field__empty">No icons found</div>}
        </div>
      </Drawer>
    </div>
  );
};

export default IconField;
