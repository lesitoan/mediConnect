import { redirect } from "next/navigation";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ invoice?: string | string[] }>;
}) {
  const { invoice } = await searchParams;
  const invoiceId = Array.isArray(invoice) ? invoice[0] : invoice;
  redirect(
    invoiceId
      ? `/invoices/list?invoice=${encodeURIComponent(invoiceId)}`
      : "/invoices/list",
  );
}
