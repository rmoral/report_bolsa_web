import React from "react";
import { generateMetadata as generatePageMetadata, pageMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import PricingClient from "./PricingClient";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata(pageMetadata.pricing.es);
}

export default function PreciosPage() {
  return <PricingClient />;
}