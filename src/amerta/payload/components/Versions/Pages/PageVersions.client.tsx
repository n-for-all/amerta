"use client";
import React, { useEffect, useState } from "react";
import { Button, toast, useModal, ConfirmationModal } from "@payloadcms/ui";
import { getServerSideURL } from "@/amerta/utilities/getURL";
import { getAdminURL } from "@/amerta/utilities/getAdminURL";

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
};

interface Page {
  id: string;
  title: string;
  slug: string;
  updatedAt: string;
  _status?: string;
}

const ClientPageVersions = () => {
  const [pages, setPages] = useState<{
    [key: string]: {
      id: string;
      parent: string;
      version: Page;
      createdAt: string;
      updatedAt: string;
      latest?: boolean;
      autosave?: boolean;
    }[];
  }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [, setRestoringVersions] = useState<Set<string>>(new Set());
  const [deletingVersions, setDeletingVersions] = useState<Set<string>>(new Set());
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] = useState<{ versionId: string; pageId: string } | null>(null);

  const apiURL = getServerSideURL();
  const [pagination, setPagination] = useState<{
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: string | number | null;
    nextPage: string | number | null;
  }>({
    totalDocs: 0,
    limit: 0,
    totalPages: 0,
    page: 0,
    pagingCounter: 0,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null,
  });

  const { openModal } = useModal();

  useEffect(() => {
    const fetchPagesWithVersions = async () => {
      setLoading(true);
      try {
        // First, get all pages
        const pagesResponse = await fetch(`${apiURL}/api/pages/versions?limit=1000&sort=-updatedAt`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!pagesResponse.ok) {
          throw new Error(`Failed to fetch pages: ${pagesResponse.statusText}`);
        }

        const pagesData = await pagesResponse.json();
        const pagesGroup: {
          [key: string]: {
            id: string;
            parent: string;
            version: Page;
            createdAt: string;
            updatedAt: string;
            latest?: boolean;
            autosave?: boolean;
          }[];
        } = {};
        (pagesData.docs || []).forEach((page) => {
          if (!pagesGroup[page.parent]) {
            pagesGroup[page.parent] = [];
          }
          pagesGroup[page.parent]!.push(page);
        });

        setPages(pagesGroup);
        setPagination({
          totalDocs: pagesData.totalDocs,
          limit: pagesData.limit,
          totalPages: pagesData.totalPages,
          page: pagesData.page,
          pagingCounter: pagesData.pagingCounter,
          hasPrevPage: pagesData.hasPrevPage,
          hasNextPage: pagesData.hasNextPage,
          prevPage: pagesData.prevPage,
          nextPage: pagesData.nextPage,
        });
      } catch (error) {
        console.error("Error fetching pages with versions:", error);
        if (toast?.error) {
          toast.error("Failed to load pages with versions.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPagesWithVersions();
  }, [apiURL]);

  const handleRestore = async () => {
    if (!pendingRestore) return;

    const { versionId } = pendingRestore;

    setPendingRestore(null);
    setRestoringVersions((prev) => new Set([...prev, versionId]));

    try {
      // Use the Payload API to restore version
      const restoreResponse = await fetch(`${apiURL}/api/pages/versions/${versionId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (restoreResponse.ok) {
        if (toast?.success) {
          toast.success(`Page version restored successfully!`);
        }

        // Refresh the data
        window.location.reload();
      } else {
        const errorData = await restoreResponse.json().catch(() => ({}));
        const errorMessage = errorData.message || restoreResponse.statusText || "Unknown error";

        if (toast?.error) {
          toast.error(`Restoration failed: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error("Error restoring page version:", error);
      if (toast?.error) {
        toast.error("An unexpected error occurred during restoration.");
      }
    } finally {
      setRestoringVersions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(versionId);
        return newSet;
      });
    }
  };

  const confirmDelete = (index: string) => {
    setPendingDeleteIndex(index);
    openModal("delete-versions");
  };

  const handleDelete = async () => {
    if (!pendingDeleteIndex) return;

    const index = pendingDeleteIndex;

    setPendingDeleteIndex(null);
    setDeletingVersions((prev) => new Set([...prev, index]));

    try {
      // Use the Payload API to delete version
      // Loop through all versions for this page and delete them
      const allVersions = pages[index] || [];
      let deletedCount = 0;

      for (const version of allVersions) {
        try {
          const deleteResponse = await fetch(`${apiURL}/api/pages/versions/${version.id}`, {
            method: "DELETE",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (deleteResponse.ok) {
            deletedCount++;
          } else {
            const errorData = await deleteResponse.json().catch(() => ({}));
            const errorMessage = errorData.message || deleteResponse.statusText || "Unknown error";
            console.error(`Failed to delete version ${version.id}:`, errorMessage);
          }
        } catch (error) {
          console.error(`Error deleting version ${version.id}:`, error);
        }
      }

      if (deletedCount > 0) {
        if (toast?.success) {
          toast.success(`${deletedCount} version${deletedCount !== 1 ? "s" : ""} deleted successfully!`);
        }

        // Remove the page entry from state since all versions are deleted
        setPages((prevPages) => {
          const newPages = { ...prevPages };
          delete newPages[index];
          return newPages;
        });

        // Update pagination count
        setPagination((prev) => ({
          ...prev,
          totalDocs: prev.totalDocs - deletedCount,
        }));
      } else {
        if (toast?.error) {
          toast.error(`Failed to delete versions`);
        }
      }
    } catch {
      if (toast?.error) {
        toast.error("An unexpected error occurred during deletion.");
      }
    } finally {
      setDeletingVersions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "1rem" }}>
        <p>Loading pages with versions...</p>
      </div>
    );
  }

  if (Object.keys(pages).length === 0) {
    return (
      <div style={{ padding: "1rem" }}>
        <p>No pages with versions found.</p>
      </div>
    );
  }

  const total = pagination.totalDocs;

  return (
    <div style={{ padding: "1rem 0" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h3>All Pages with Version History</h3>
        <p>
          {Object.keys(pages).length} page{Object.keys(pages).length !== 1 ? "s" : ""} with {total} versions found
        </p>
      </div>

      <div className="table">
        <table>
          <thead>
            <tr>
              <th>
                <div className="select-all select-all__checkbox checkbox-input">
                  <div className="checkbox-input__input">
                    <input type="checkbox" name="select-all" />
                    <span className="checkbox-input__icon check" />
                  </div>
                </div>
              </th>
              <th>Page</th>
              <th>Status</th>
              <th>Versions</th>
              <th>Created At</th>
              <th>Last Updated</th>
              <th>Latest</th>
              <th>Autosave</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(pages).map((index) => {
              const page = pages[index]![0]!;
              const latestVersion = pages[index]?.find((v) => v.latest);
              return (
                <React.Fragment key={index}>
                  <tr>
                    <td>
                      <div className="select-row select-row__checkbox checkbox-input">
                        <div className="checkbox-input__input">
                          <input type="checkbox" />
                          <span className="checkbox-input__icon check" />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <a href={getAdminURL(`/collections/pages/${page.parent}`)}>{page.version.title || "Untitled"}</a>
                        <div>/{page.version.slug || ""}</div>
                      </div>
                    </td>
                    <td>{page.version.title || "Untitled"}</td>
                    <td>
                      <span>{pages[index]?.length} Versions</span>
                    </td>
                    <td>
                      <div>{latestVersion ? formatRelativeTime(new Date(latestVersion.createdAt)) : "---"}</div>
                    </td>
                    <td>
                      <div>{latestVersion ? formatRelativeTime(new Date(latestVersion.updatedAt)) : "---"}</div>
                    </td>
                    <td>
                      <div>{page.latest ? "Yes" : "No"}</div>
                    </td>
                    <td>
                      <div>{page.autosave ? "Yes" : "No"}</div>
                    </td>
                    <td style={{ minWidth: "250px" }}>
                      <div style={{ display: "flex", gap: "0.5rem", "--base": "1" } as React.CSSProperties}>
                        {/* {latestVersion ? (
                          <Button onClick={() => confirmRestore(latestVersion.id, index)} size="small" buttonStyle="primary" disabled={restoringVersions.has(latestVersion.id)}>
                            {restoringVersions.has(latestVersion.id) ? "Restoring..." : "Restore"}
                          </Button>
                        ) : (
                          "No Latest Version"
                        )} */}
                        <Button onClick={() => confirmDelete(index)} size="small" buttonStyle="error" disabled={deletingVersions.has(index)}>
                          {deletingVersions.has(index) ? "Deleting..." : "Delete All Versions"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmationModal modalSlug={"delete-versions"} heading="Delete All Versions" onConfirm={handleDelete} body={<p>Are you sure you want to delete all versions for this page? This action cannot be undone.</p>}></ConfirmationModal>
      <ConfirmationModal modalSlug={"restore-versions"} onConfirm={handleRestore} body={<p>Are you sure you want to restore this version? This will overwrite the current page.</p>} heading="Restore Version"></ConfirmationModal>
    </div>
  );
};

export { ClientPageVersions };
