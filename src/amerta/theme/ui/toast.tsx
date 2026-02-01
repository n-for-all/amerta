"use client";
import { ReactNode, useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { Button } from "./button";

const CloseIcon = ({ className }: { className: string }) => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16" className={className}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06065 7.99999L13.5303 3.53032L14.0607 2.99999L13 1.93933L12.4697 2.46966L7.99999 6.93933L3.53032 2.46966L2.99999 1.93933L1.93933 2.99999L2.46966 3.53032L6.93933 7.99999L2.46966 12.4697L1.93933 13L2.99999 14.0607L3.53032 13.5303L7.99999 9.06065L12.4697 13.5303Z" />
  </svg>
);

const UndoIcon = () => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16" className="fill-gray-1000">
    <path fillRule="evenodd" clipRule="evenodd" d="M13.5 8C13.5 4.96643 11.0257 2.5 7.96452 2.5C5.42843 2.5 3.29365 4.19393 2.63724 6.5H5.25H6V8H5.25H0.75C0.335787 8 0 7.66421 0 7.25V2.75V2H1.5V2.75V5.23347C2.57851 2.74164 5.06835 1 7.96452 1C11.8461 1 15 4.13001 15 8C15 11.87 11.8461 15 7.96452 15C5.62368 15 3.54872 13.8617 2.27046 12.1122L1.828 11.5066L3.03915 10.6217L3.48161 11.2273C4.48831 12.6051 6.12055 13.5 7.96452 13.5C11.0257 13.5 13.5 11.0336 13.5 8Z" />
  </svg>
);

type Toast = {
  id: number;
  text: string | ReactNode;
  measuredHeight?: number;
  timeout?: NodeJS.Timeout;
  remaining?: number;
  start?: number;
  pause?: () => void;
  resume?: () => void;
  preserve?: boolean;
  action?: string;
  onAction?: () => void;
  onUndoAction?: () => void;
  type: "message" | "success" | "warning" | "error";
};

let toastId = 0;

const toastStore = {
  toasts: [] as Toast[],
  listeners: new Set<() => void>(),

  add(text: string | ReactNode, type: "message" | "success" | "warning" | "error", preserve?: boolean, action?: string, onAction?: () => void, onUndoAction?: () => void) {
    const id = toastId++;

    const toast: Toast = {
      id,
      text,
      preserve,
      action,
      onAction,
      onUndoAction,
      type,
    };

    toast.remaining = 5000;
    toast.start = Date.now();

    const close = () => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
      this.notify();
    };

    toast.timeout = setTimeout(close, toast.remaining);

    toast.pause = () => {
      if (!toast.timeout) return;
      clearTimeout(toast.timeout);
      toast.timeout = undefined;
      toast.remaining! -= Date.now() - toast.start!;
    };

    toast.resume = () => {
      if (toast.timeout) return;
      toast.start = Date.now();
      toast.timeout = setTimeout(close, toast.remaining);
    };

    this.toasts.push(toast);
    this.notify();
  },

  remove(id: number) {
    toastStore.toasts = toastStore.toasts.filter((t) => t.id !== id);
    toastStore.notify();
  },

  subscribe(listener: () => void) {
    toastStore.listeners.add(listener);
    return () => {
      toastStore.listeners.delete(listener);
    };
  },

  notify() {
    toastStore.listeners.forEach((fn) => fn());
  },
};

export const Toaster = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [shownIds, setShownIds] = useState<number[]>([]);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [progressStates, setProgressStates] = useState<Record<number, { progress: number; isPaused: boolean }>>({});

  const measureRef = (toast: Toast) => (node: HTMLDivElement | null) => {
    if (node && toast.measuredHeight == null) {
      toast.measuredHeight = node.getBoundingClientRect().height;
      toastStore.notify();
    }
  };

  useEffect(() => {
    setToasts([...toastStore.toasts]);

    return toastStore.subscribe(() => {
      setToasts([...toastStore.toasts]);
    });
  }, []);

  useEffect(() => {
    const unseen = toasts.filter((t) => !shownIds.includes(t.id)).map((t) => t.id);
    if (unseen.length > 0) {
      requestAnimationFrame(() => {
        setShownIds((prev) => [...prev, ...unseen]);
      });
    }
  }, [toasts]);

  // Progress animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setProgressStates((prev) => {
        const newStates = { ...prev };
        toasts.forEach((toast) => {
          const current = newStates[toast.id] || { progress: 100, isPaused: false };
          const isPaused = isHovered || current.isPaused;

          if (!isPaused && current.progress > 0) {
            // Decrease progress by 100/30 per 100ms (3 seconds total)
            newStates[toast.id] = {
              ...current,
              progress: Math.max(0, current.progress - 100 / 30),
            };
          } else {
            newStates[toast.id] = { ...current, isPaused };
          }
        });
        return newStates;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [toasts, isHovered]);

  // Clean up progress states for removed toasts
  useEffect(() => {
    const currentToastIds = toasts.map(t => t.id);
    setProgressStates((prev) => {
      const newStates = { ...prev };
      Object.keys(newStates).forEach((id) => {
        if (!currentToastIds.includes(Number(id))) {
          delete newStates[Number(id)];
        }
      });
      return newStates;
    });
  }, [toasts]);

  // Initialize progress for new toasts
  useEffect(() => {
    toasts.forEach((toast) => {
      if (!progressStates[toast.id]) {
        setProgressStates((prev) => ({
          ...prev,
          [toast.id]: { progress: 100, isPaused: false },
        }));
      }
    });
  }, [toasts, progressStates]);

  const lastVisibleCount = 3;
  const lastVisibleStart = Math.max(0, toasts.length - lastVisibleCount);

  const getFinalTransform = (index: number, length: number) => {
    if (index === length - 1) {
      return "none";
    }
    const offset = length - 1 - index;
    let translateY = toasts[length - 1]?.measuredHeight || 63;
    for (let i = length - 1; i > index; i--) {
      if (isHovered) {
        translateY += (toasts[i - 1]?.measuredHeight || 63) + 10;
      } else {
        translateY += 20;
      }
    }
    const z = -offset;
    const scale = isHovered ? 1 : 1 - 0.05 * offset;
    return `translate3d(0, calc(100% - ${translateY}px), ${z}px) scale(${scale})`;
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setProgressStates((prev) => {
      const newStates = { ...prev };
      Object.keys(newStates).forEach((id) => {
        newStates[Number(id)]!.isPaused = true;
      });
      return newStates;
    });
    toastStore.toasts.forEach((t) => t.pause?.());
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setProgressStates((prev) => {
      const newStates = { ...prev };
      Object.keys(newStates).forEach((id) => {
        newStates[Number(id)]!.isPaused = false;
      });
      return newStates;
    });
    toastStore.toasts.forEach((t) => t.resume?.());
  };

  const visibleToasts = toasts.slice(lastVisibleStart);
  const containerHeight = visibleToasts.reduce((acc, toast) => {
    return acc + (toast.measuredHeight ?? 63);
  }, 0);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none w-[420px]" style={{ height: containerHeight }}>
      <div className="relative w-full pointer-events-auto" style={{ height: containerHeight }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {toasts.map((toast, index) => {
          const isVisible = index >= lastVisibleStart;

          return (
            <div
              key={toast.id}
              ref={measureRef(toast)}
              className={clsx(
                "absolute right-0 rounded bottom-0 shadow-menu leading-[21px] p-4 h-fit",
                {
                  message: "bg-neutral-100 text-black",
                  success: "bg-green-700 text-white",
                  warning: "bg-yellow-800 text-white",
                  error: "bg-red-800 text-white",
                }[toast.type],
                isVisible ? "opacity-100" : "opacity-0",
                index < lastVisibleStart && "pointer-events-none",
              )}
              style={{
                width: 420,
                transition: "all .35s cubic-bezier(.25,.75,.6,.98)",
                transform: shownIds.includes(toast.id) ? getFinalTransform(index, toasts.length) : "translate3d(0, 100%, 150px) scale(1)",
              }}
            >
              {progressStates && (progressStates[toast.id]?.progress ?? 100) > 0 && (
                <div className="absolute top-0 left-0 w-full h-1 mb-2 overflow-hidden rounded-full bg-black/20">
                  <div
                    className="h-full transition-all duration-100 ease-linear bg-white/80"
                    style={{
                      width: `${progressStates[toast.id]?.progress ?? 100}%`,
                    }}
                  />
                </div>
              )}

              <div className="flex flex-col items-center justify-between text-[.875rem]">
                <div className="flex items-center justify-between w-full h-full gap-4">
                  <span>{toast.text}</span>
                  {!toast.action && (
                    <div className="flex gap-1">
                      {toast.onUndoAction && (
                        <Button
                          size="sm"
                          variant={"ghost"}
                          className="px-1 text-white hover:bg-black/10"
                          onClick={() => {
                            toast.onUndoAction?.();
                            toastStore.remove(toast.id);
                          }}
                        >
                          <UndoIcon />
                        </Button>
                      )}
                      <Button variant={"ghost"} size="sm" className="px-1 text-white hover:bg-black/10" onClick={() => toastStore.remove(toast.id)}>
                        <CloseIcon
                          className={
                            {
                              message: "fill-black",
                              success: "fill-white",
                              warning: "fill-white",
                              error: "fill-white",
                            }[toast.type]
                          }
                        />
                      </Button>
                    </div>
                  )}
                </div>
                {toast.action && (
                  <div className="flex items-center justify-end w-full gap-2">
                    <Button variant={"ghost"} size="sm" onClick={() => toastStore.remove(toast.id)}>
                      Dismiss
                    </Button>
                    <Button
                      variant={"ghost"}
                      size="sm"
                      onClick={() => {
                        if (toast?.onAction) {
                          toast?.onAction();
                        }
                        toastStore.remove(toast.id);
                      }}
                    >
                      {toast.action}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface Message {
  text: string | ReactNode;
  preserve?: boolean;
  action?: string;
  onAction?: () => void;
  onUndoAction?: () => void;
}

export const useToast = () => {
  return {
    message: useCallback(({ text, preserve, action, onAction, onUndoAction }: Message) => {
      toastStore.add(text, "message", preserve, action, onAction, onUndoAction);
    }, []),
    success: useCallback((text: string) => {
      toastStore.add(text, "success");
    }, []),
    warning: useCallback((text: string) => {
      toastStore.add(text, "warning");
    }, []),
    error: useCallback((text: string) => {
      toastStore.add(text, "error");
    }, []),
    toast: useCallback((text: string, type: "message" | "success" | "warning" | "error", preserve?: boolean, action?: string, onAction?: () => void) => {
      toastStore.add(text, type, preserve, action, onAction);
    }, []),
  };
};
