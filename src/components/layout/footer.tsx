import Link from "next/link";
import { HaloftLogo } from "@/components/ui/logo";
import { CONTACT_EMAIL, DEFAULT_CAMPUS_SLUG, SOCIAL_LINKS } from "@/lib/constants";

export function Footer({ campusSlug }: { campusSlug?: string } = {}) {
  const campus = campusSlug ?? DEFAULT_CAMPUS_SLUG;

  const columns = [
    {
      title: "Explore",
      links: [
        { label: "Find a home", href: `/${campus}/search` },
        { label: "Universities", href: "/#universities" },
        { label: "How it works", href: "/#how-it-works" },
      ],
    },
    {
      title: "Property owners",
      links: [
        {
          label: "List a property",
          href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
            "Listing a property on Haloft"
          )}`,
        },
        { label: "How listings work", href: "/#for-owners" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Haloft", href: "/#about" },
        { label: "Contact", href: `mailto:${CONTACT_EMAIL}` },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/legal/privacy" },
        { label: "Terms", href: "/legal/terms" },
        { label: "Refunds", href: "/legal/refunds" },
      ],
    },
  ];

  return (
    <footer className="mt-auto bg-[var(--night)] text-[var(--night-foreground)]">
      <div className="shell py-16 lg:py-20">
        <div className="grid grid-cols-12 gap-y-12 lg:gap-x-10">
          {/* Identity */}
          <div className="col-span-12 lg:col-span-4">
            <Link href="/" aria-label="Haloft — home">
              <HaloftLogo size={30} tone="light" markId="footer" />
            </Link>
            <p className="mt-5 max-w-[24ch] text-[15px] leading-[1.5] text-white/70">
              Student housing, made clearer.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-5 inline-block border-b border-white/20 pb-0.5 text-[13.5px] text-white/60 transition-colors hover:border-white/50 hover:text-white/90"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          {/* Navigation */}
          <div className="col-span-12 grid grid-cols-2 gap-y-10 sm:grid-cols-4 lg:col-span-7 lg:col-start-6 lg:gap-x-8">
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  {column.title}
                </h2>
                <ul className="mt-3 space-y-0.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("mailto:") ? (
                        <a
                          href={link.href}
                          className="inline-block py-1.5 text-[13.5px] text-white/70 transition-colors hover:text-white"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="inline-block py-1.5 text-[13.5px] text-white/70 transition-colors hover:text-white"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/12 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-white/45">
            © {new Date().getFullYear()} Haloft. All rights reserved.
          </p>

          {SOCIAL_LINKS.length > 0 && (
            <ul className="flex items-center gap-6">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[12.5px] text-white/50 transition-colors hover:text-white"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
