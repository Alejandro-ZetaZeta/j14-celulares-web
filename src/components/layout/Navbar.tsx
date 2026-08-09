import { getBrandModelGroups } from "@/lib/data/catalog";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const brandGroups = await getBrandModelGroups();
  return <NavbarClient brandGroups={brandGroups} />;
}
