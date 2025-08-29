import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing QC Review',
  description: 'Module 7: Billing QC Review - Compare client approved fees and invoice data',
};

export default function BillingQCLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      {children}
    </div>
  );
}