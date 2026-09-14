"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandHeaderLockup } from "@/components/Brand";

/**
 * The header's logo + org/platform name (BrandHeaderLockup) — shown on
 * every page except the homepage. On the homepage, the Hero section right
 * below (BrandHeroLockup) already shows the same logo and both brand lines,
 * larger and centered, directly under this header — so showing it a second
 * time here was pure visual clutter stacked right on top of itself
 * (explicit user request: "upar ka logo/naam hata do, niche already dikh
 * raha hai"). Every other page has no hero, so the header stays the only
 * place branding shows there — unchanged.
 *
 * Renders an empty (zero-width) placeholder instead of `null` on the
 * homepage so the header's `justify-between` flex layout still has two
 * children and the right-side nav stays pinned to the right edge.
 */
export function HeaderBrand() {
  const pathname = usePathname();
  if (pathname === "/") {
    return <span aria-hidden />;
  }
  return (
    <Link href="/" className="min-w-0">
      <BrandHeaderLockup />
    </Link>
  );
}
