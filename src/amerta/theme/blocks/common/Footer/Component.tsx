import { getCachedGlobal } from "@/amerta/utilities/getGlobals";

import type { Footer } from "@/payload-types";

import { Config } from "payload";
import { CMSLink } from "@/amerta/components/Link";
import { Media } from "@/amerta/components/Media";
import { FooterForm } from "./form";

const FooterLogo = ({ logoLight, logoDark, logoClassName }) => {
  return (
    <div className={logoClassName || ""}>
      {logoLight && (
        <div className="block h-full dark:hidden">
          <Media resource={logoLight} className="relative h-full" imgClassName="w-auto!" fill={true} />
        </div>
      )}
      {logoDark && (
        <div className="hidden h-full dark:block">
          <Media resource={logoDark} className="relative h-full" imgClassName="w-auto!" fill={true} />
        </div>
      )}
      {/* Fallback if only one logo is provided */}
      {!logoDark && logoLight && (
        <div className="hidden h-full dark:block">
          <Media resource={logoLight} className="relative h-full" imgClassName="w-auto!" fill={true} />
        </div>
      )}
      {!logoLight && logoDark && (
        <div className="block h-full dark:hidden">
          <Media resource={logoDark} className="relative h-full" imgClassName="w-auto!" fill={true} />
        </div>
      )}
    </div>
  );
};

// const SocialIcons = {
//   facebook: (
//     <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
//       <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
//     </svg>
//   ),
// };

export async function Footer({ locale }: { locale?: string }) {
  const footerData: Footer = await getCachedGlobal("footer" as keyof Config["globals"], 1, locale)();

  const { logoLight, logoDark, logoClassName, footerButton, title, description, footerMenus = [], footerForm, socialMedia = [], copyright, className, footerBottomMenu } = footerData || {};
  const hasForm = footerForm?.enable && footerForm?.form;
  return (
    <footer className={`bg-white pb-8 border-t mt-16 border-zinc-200 dark:border-zinc-800 pt-16 sm:pt-28 lg:pt-32 dark:bg-zinc-950 ${className || ""}`}>
      <div className={`container`}>
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Logo Section */}
          <div>
            <FooterLogo logoLight={logoLight} logoDark={logoDark} logoClassName={logoClassName || "h-12"} />
            {title ? <p className="max-w-lg mt-6 text-sm text-zinc-600 dark:text-zinc-300">{title}</p> : null}
            {description ? <p className="max-w-lg mt-2 mr-10 text-sm rtl:ml-10 rtl:mr-0 text-zinc-600 dark:text-zinc-300">{description}</p> : null}
            {footerButton && <CMSLink className="inline-block mt-4" size="lg" {...footerButton} locale={locale!} />}
          </div>

          {/* Menu Sections */}
          <div className="grid grid-cols-2 gap-8 mt-16 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              {/* Solutions Column */}
              {footerMenus && footerMenus[0] && (
                <div>
                  <p className="font-medium uppercase text-sm/6">{footerMenus[0].title || "Solutions"}</p>
                  <ul role="list" className="mt-6 space-y-4">
                    {footerMenus[0].menu &&
                      typeof footerMenus[0].menu === "object" &&
                      footerMenus[0].menu.navItems?.map((menuItem, idx) => (
                        <li key={idx}>
                          <CMSLink className="uppercase text-sm/6 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200" {...menuItem.link} appearance={undefined} locale={locale!} />
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Support Column */}
              {footerMenus && footerMenus[1] && (
                <div className="mt-10 md:mt-0">
                  <p className="font-medium uppercase text-sm/6">{footerMenus[1].title || "Support"}</p>
                  <ul role="list" className="mt-6 space-y-4">
                    {footerMenus[1].menu &&
                      typeof footerMenus[1].menu === "object" &&
                      footerMenus[1].menu.navItems?.map((menuItem, idx) => (
                        <li key={idx}>
                          <CMSLink className="uppercase text-sm/6 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200" {...menuItem.link} appearance={undefined} locale={locale!} />
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-8">
              {/* Company Column */}
              {footerMenus && footerMenus[2] && (
                <div>
                  <p className="font-medium uppercase text-sm/6">{footerMenus[2].title || ""}</p>
                  <ul role="list" className="mt-6 space-y-4">
                    {footerMenus[2].menu &&
                      typeof footerMenus[2].menu === "object" &&
                      footerMenus[2].menu.navItems?.map((menuItem, idx) => (
                        <li key={idx}>
                          <CMSLink className="uppercase text-sm/6 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200" {...menuItem.link} appearance={undefined} locale={locale!} />
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Footer Form Section (if enabled) */}
              {hasForm && (
                <div className="flex flex-col items-start col-span-1 mb-4 md:col-span-1 md:mb-0 lg:col-span-2">
                  <p className="font-medium uppercase text-sm/6">{footerForm.title}</p>
                  <div className="flex items-center w-full mt-2">{footerForm.form && typeof footerForm.form == "object" && <FooterForm form={footerForm.form} />}</div>

                  {footerForm.description && <p className="mt-4 text-sm font-medium tracking-tight text-left text-zinc-600 dark:text-zinc-300 lg:text-sm">{footerForm.description}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section with Social and Copyright */}
        <div className="pt-8 mt-10 border-t border-zinc-900/10 dark:border-white/10 md:flex md:items-center md:justify-between">
          {/* Social Icons */}

          {socialMedia && socialMedia.length > 0 ? (
            <div className="flex justify-end flex-1 gap-x-6 md:order-3">
              {socialMedia.map((social, idx) => (
                <a key={idx} className="text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200" href={social.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit our ${social.platform} page`}>
                  <span className="sr-only">{social.platform}</span>
                  {social.platform === "facebook" && (
                    <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" className="size-6">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  )}
                  {social.platform === "instagram" && (
                    <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" className="size-6">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {social.platform === "twitter" && (
                    <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" className="size-6">
                      <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
                    </svg>
                  )}
                  {social.platform === "github" && (
                    <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" className="size-6">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  )}
                  {social.platform === "youtube" && (
                    <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" className="size-6">
                      <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          ) : null}

          {footerBottomMenu ? (
            <ul role="list" className="flex justify-center flex-1 gap-4 md:order-2">
              {footerBottomMenu.menu &&
                typeof footerBottomMenu.menu === "object" &&
                footerBottomMenu.menu.navItems?.map((menuItem, idx) => (
                  <li key={idx}>
                    <CMSLink className="uppercase text-sm/6 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200" {...menuItem.link} appearance={undefined} locale={locale!} />
                  </li>
                ))}
            </ul>
          ) : null}

          <p className="flex-1 mt-8 uppercase text-sm/6 text-zinc-600 md:order-1 md:mt-0 dark:text-zinc-400">{copyright || ""}</p>
        </div>
      </div>
    </footer>
  );
}
