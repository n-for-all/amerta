"use client";

import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import RichText from "@/amerta/theme/components/RichText";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { ThemeShopFeaturesBlock as FeaturesBlockProps } from "@/payload-types";

export const FeaturesAccordion = ({ items }: { items: FeaturesBlockProps["features"] }) => {
  const { locale } = useEcommerce();
  return (
    <dl className="divide-y divide-zinc-900/10 dark:divide-white/10">
      {items.map((item, index) => (
        <Disclosure as="div" key={item.id || index} className="py-6 first:pt-0 last:pb-0" defaultOpen={index === 0}>
          {({ open }) => (
            <>
              <dt>
                <DisclosureButton className="flex items-center justify-between w-full group text-start">
                  <span className="font-medium uppercase text-sm/6 text-zinc-900 dark:text-white">{item.title}</span>
                  <span className="self-center ms-6 text-zinc-600 dark:text-zinc-400">
                    {open ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4">
                        <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4">
                        <path fillRule="evenodd" d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" clipRule="evenodd"></path>
                      </svg>
                    )}
                  </span>
                </DisclosureButton>
              </dt>
              <DisclosurePanel className="mt-3">
                <div className="max-w-sm text-zinc-600 dark:text-zinc-400 text-sm/6">
                  <RichText data={item.description} enableProse={false} enableGutter={false} locale={locale} />
                </div>
              </DisclosurePanel>
            </>
          )}
        </Disclosure>
      ))}
    </dl>
  );
};
