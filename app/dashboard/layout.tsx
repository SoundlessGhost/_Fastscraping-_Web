import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client dashboard",
  robots: { index: false, follow: false },
  alternates: { canonical: "/dashboard/login" },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
