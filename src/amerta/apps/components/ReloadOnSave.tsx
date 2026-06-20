"use client";

import { useEffect, useRef } from "react";
import { useDocumentInfo } from "@payloadcms/ui";

export const ReloadOnSave: React.FC = () => {
  const { lastUpdateTime } = useDocumentInfo();
  const initialMount = useRef(true);
  const initialTime = useRef(lastUpdateTime);

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    if (lastUpdateTime > initialTime.current) {
      // The document was successfully saved, force a full page reload
      // to ensure the sidebar updates with the new active apps.
      window.location.reload();
    }
  }, [lastUpdateTime]);

  return null;
};
