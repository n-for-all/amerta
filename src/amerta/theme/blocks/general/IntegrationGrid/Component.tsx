import React from "react";

import type { ThemeShopIntegrationGridBlock as IntegrationGridData } from "@/payload-types";

import { Media } from "@/amerta/components/Media";
import { cn } from "@/amerta/utilities/ui";

type Props = IntegrationGridData & {
  id?: string;
  className?: string;
};

export const ThemeShopIntegrationGridBlock: React.FC<Props> = ({ className, heading, id, integrations, subtext }) => {
  return (
    <section className={cn("container mt-24 sm:mt-28 lg:mt-40", className)} id={id}>
      <div className="overflow-hidden rounded-lg border bg-background px-6 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="mx-auto flex max-w-5xl flex-col gap-12">
          <div className="flex flex-col gap-4 text-center">
            <h2 className="text-balance text-3xl font-medium sm:text-4xl">{heading}</h2>
            {subtext ? <p className="mx-auto max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">{subtext}</p> : null}
          </div>

          {integrations?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {integrations.map((item, index) => (
                <article className="flex flex-col gap-5 rounded-lg border bg-background p-6" key={item.id ?? `${item.name}-${index}`}>
                  <div className="flex size-12 items-center justify-center rounded-md border bg-muted/30">
                    <Media resource={item.logo} imgClassName="size-7 w-auto object-contain" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-base font-medium">{item.name}</h3>
                    {item.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p> : null}
                  </div>

                  {item.href ? (
                    <div className="mt-auto border-t border-dashed pt-5">
                      <a className="inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline" href={item.href}>
                        {item.name}
                        <span aria-hidden="true">&rarr;</span>
                      </a>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
