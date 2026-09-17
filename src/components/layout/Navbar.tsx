import { getBrandModelGroups } from "@/lib/data/catalog";
import NavbarClient from "./NavbarClient";

export default async function Navbar({ whatsappNumber }: { whatsappNumber: string }) {
  const brandGroups = await getBrandModelGroups();
  return <NavbarClient brandGroups={brandGroups} whatsappNumber={whatsappNumber} />;
}
