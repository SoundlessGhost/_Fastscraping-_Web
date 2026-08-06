import TemuCodes from "@/components/admin/TemuCodes";

export const dynamic = "force-dynamic";

// The admin layout already gates this on role === ADMIN.
export default function TemuCodesPage() {
  return <TemuCodes />;
}
