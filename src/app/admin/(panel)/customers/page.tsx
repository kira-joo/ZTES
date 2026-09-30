import { CustomerListView } from "src/features/admin/customers/customer-list-view";

export const metadata = { title: "Customers" };

export default function AdminCustomersPage() {
  return <CustomerListView />;
}
