import { Button } from "@/amerta/theme/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/amerta/theme/ui/dialog";
import { CircleAlert } from "lucide-react";
import { useEffect, useRef } from "react";

export const ErrorDialog = ({ title, open, errors, onClose }: { title: string; errors: Record<string, any>; open: boolean; onClose: () => void }) => {
  const messages = useRef<{ [x: string]: string }>({});
  useEffect(() => {
    messages.current = {};
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        {title ? (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        ) : null}
        <DialogBody>
          <p className="mb-4 text-sm text-zinc-600">Please fix the following errors before proceeding:</p>
          <ul className="space-y-2">
            {Object.entries(errors).map(([field, error]) => {
              if (field === "root") return null;
              messages.current[error.message as string] = error.message as string;
              return (
                <li key={field} className="flex items-start gap-2">
                  <CircleAlert className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error.message as string}</p>
                </li>
              );
            })}
            {errors.root && !messages.current[errors.root.message as string] && (
              <li className="flex items-start gap-2">
                <CircleAlert className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600">{errors.root.message as string}</p>
              </li>
            )}
          </ul>
        </DialogBody>
        <DialogFooter>
          <Button onClick={onClose} variant="default">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
