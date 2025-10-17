import { generateMetadata as generatePageMetadata, pageMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import TerminosClient from "./TerminosClient";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata(pageMetadata.terms.en);
}

export default function TerminosPage() {
  return <TerminosClient />;
}