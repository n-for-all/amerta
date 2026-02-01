"use client";


import { Facebook, Mail, Twitter } from "lucide-react";
import Link from "next/link";
import { FC, useEffect, useMemo, useState } from "react";

type SocialType = {
  name: string;
  href: string;
  icon: any;
};

interface Props {
  className?: string;
  itemClass?: string;
  socials?: SocialType[];
  title?: string;
  url?: string;
}

const SocialsList: FC<Props> = ({ className = "", itemClass = "block", socials, title = "Check this out", url }) => {
  const [currentUrl, setCurrentUrl] = useState("");
  useEffect(() => {
    // You can add any side effects related to currentUrl or title here if needed
    setCurrentUrl(window.location.href);
  }, [currentUrl, title]);

  const socialsDemo: SocialType[] = useMemo(
    () => [
      {
        name: "Facebook",
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
        icon: <Facebook className="w-6 h-6" strokeWidth={1} />,
      },
      {
        name: "Email",
        href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(currentUrl)}`,
        icon: <Mail className="w-6 h-6" strokeWidth={1}/>,
      },
      {
        name: "Twitter",
        href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`,
        icon: <Twitter className="w-6 h-6" strokeWidth={1}/>,
      },
    ],
    [currentUrl, title],
  );

  const finalSocials = socials || socialsDemo;

  return (
    <nav className={`flex gap-x-3.5 text-2xl text-zinc-600 dark:text-zinc-300 ${className}`}>
      {finalSocials.map((item, i) => (
        <Link key={i} className={itemClass} href={item.href} target="_blank" rel="noopener noreferrer">
          {item.icon}
        </Link>
      ))}
    </nav>
  );
};

export default SocialsList;
