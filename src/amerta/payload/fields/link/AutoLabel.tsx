"use client";

import React, { useEffect, useRef } from "react";
import { TextField, useField, useConfig, useLocale } from "@payloadcms/ui";

type Props = {
  path: string;
  [key: string]: any;
};

export const AutoLabel: React.FC<Props> = (props) => {
  const { path, field } = props;
  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig();

  // 1. Get the current Locale
  const { code: localeCode } = useLocale();

  const { value, setValue } = useField<string>({ path });

  const parentPath = path.substring(0, path.lastIndexOf("."));
  const referencePath = parentPath ? `${parentPath}.reference` : "reference";

  const { value: referenceValue } = useField<{ relationTo: string; value: string }>({
    path: referencePath,
  });

  // 2. Track both ID and Locale to trigger refetch if language changes
  const prevRequestKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentId = referenceValue?.value;
    const relationTo = referenceValue?.relationTo;

    if (currentId && relationTo) {
      // Create a unique key for this combination of Document + Language
      const requestKey = `${currentId}-${localeCode}`;

      // Check if we have already fetched for this specific ID in this specific Language
      if (requestKey !== prevRequestKey.current) {
        prevRequestKey.current = requestKey;

        // Only populate if label is currently empty
        if (!value) {
          const fetchTitle = async () => {
            try {
              // 3. Add locale query param to the fetch
              const res = await fetch(`${serverURL}${api}/${relationTo}/${currentId}?locale=${localeCode}`);
              const doc = await res.json();

              const title = doc.title || doc.name || doc.slug;
              if (title) setValue(title);
            } catch (err) {
              console.error(err);
            }
          };
          fetchTitle();
        }
      }
    } else {
      prevRequestKey.current = undefined;
    }
  }, [referenceValue, value, setValue, api, serverURL, localeCode]); // Added localeCode to dependencies

  return <TextField field={field} {...props} />;
};
