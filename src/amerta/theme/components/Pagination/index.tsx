import { createTranslator } from "@/amerta/theme/utilities/translation";
import { printf } from "fast-printf";

export const Pagination = async ({ currentPage, totalPages, searchParams = {}, baseUrl, locale }) => {
  const buildUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  const __ = await createTranslator(locale);

  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Page navigation" className="flex mx-auto mt-14 sm:mt-20 gap-x-2">
      {currentPage > 1 ? (
        <span className="grow basis-0">
          <a
            aria-label={__("Previous page")}
            className={`rounded-lg relative isolate inline-flex shrink-0 items-center justify-center gap-x-2 px-5 py-3.5 sm:px-6 sm:py-4 text-sm/none uppercase border border-transparent ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "text-zinc-950 hover:bg-zinc-950/5 dark:text-white dark:hover:bg-white/10"}`}
            href={buildUrl(currentPage - 1)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" color="currentColor" strokeWidth="1.5" stroke="currentColor">
              <path d="M3.99982 11.9998L19.9998 11.9998" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
              <path d="M8.99963 17C8.99963 17 3.99968 13.3176 3.99966 12C3.99965 10.6824 8.99966 7 8.99966 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
            </svg>
            {__("Previous")}
          </a>
        </span>
      ) : null}
      <span className="items-baseline hidden gap-x-2 sm:flex">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <a
            key={page}
            aria-label={printf(__("Page %s"), page)}
            className={`min-w-[2.25rem] rounded-lg relative isolate inline-flex shrink-0 items-center justify-center gap-x-2 px-5 py-3.5 sm:px-6 sm:py-4 text-sm/none uppercase border border-transparent ${page === currentPage ? "bg-zinc-950/5 dark:bg-white/10" : ""} text-zinc-950 hover:bg-zinc-950/5 dark:text-white dark:hover:bg-white/10`}
            href={buildUrl(page)}
          >
            {page}
          </a>
        ))}
      </span>
      {currentPage >= totalPages ? null : (
        <span className="flex justify-end grow basis-0">
          <a
            aria-label={__("Next page")}
            className={`rounded-lg relative isolate inline-flex shrink-0 items-center justify-center gap-x-2 px-5 py-3.5 sm:px-6 sm:py-4 text-sm/none uppercase border border-transparent ${currentPage >= totalPages ? "opacity-50 cursor-not-allowed" : "text-zinc-950 hover:bg-zinc-950/5 dark:text-white dark:hover:bg-white/10"}`}
            href={buildUrl(currentPage + 1)}
          >
            {__("Next")}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" color="currentColor" strokeWidth="1.5" stroke="currentColor">
              <path d="M20.0001 11.9998L4.00012 11.9998" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
              <path d="M15.0003 17C15.0003 17 20.0002 13.3176 20.0002 12C20.0002 10.6824 15.0002 7 15.0002 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
            </svg>
          </a>
        </span>
      )}
    </nav>
  );
};
