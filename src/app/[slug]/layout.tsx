import type { Metadata } from "next";
import { getTenantBySlug } from "@/lib/tenant";

// Nested layout for tenant storefronts. Nested layouts must NOT render <html>/<body>
// (only the root layout does); returning a fragment is the correct convention.
// It only exists to provide per-tenant dynamic metadata.

export const dynamic = "force-dynamic";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);

  if (!tenant) {
    return {
      title: "Restaurant not found — OrderHub",
      description: "This restaurant could not be found.",
    };
  }

  return {
    title: `${tenant.name} — Order Online`,
    description:
      tenant.tagline ||
      `Order online from ${tenant.name}. Browse the menu, add to cart, and get it delivered.`,
  };
}

export default function TenantLayout({ children }: LayoutProps) {
  return <>{children}</>;
}