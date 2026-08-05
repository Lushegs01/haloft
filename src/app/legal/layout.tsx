import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main id="main" className="flex-1">
        <article className="prose-legal mx-auto w-full max-w-[48rem] px-5 py-14 sm:px-8 lg:py-20">
          {children}
        </article>
      </main>
      <Footer />
    </div>
  );
}
