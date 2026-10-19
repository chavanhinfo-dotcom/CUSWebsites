import type { Metadata } from "next";
import AdminApp from "@/components/e/admin/AdminApp";

// Option E's admin page: edit the site's content (live, from its Supabase database). Not for search engines.
export const metadata: Metadata = {
  title: "Site admin · Chavan Udyog Samuh",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}
