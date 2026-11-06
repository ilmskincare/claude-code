import { requireCapability } from "@/lib/session";
import { PageHeader, BackLink } from "@/components/ui";
import { ProductForm } from "@/components/stock-forms";

export default async function NewProduct() {
  await requireCapability("stock.manage");
  return (<><BackLink href="/owner/stock">Stock</BackLink><PageHeader title="Add product" /><ProductForm /></>);
}
