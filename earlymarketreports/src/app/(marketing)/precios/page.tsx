import React from "react";
import { generateMetadata as generatePageMetadata, pageMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import PricingClient from "./PricingClient";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata(pageMetadata.pricing.en);
}

export default function PreciosPage() {
  return (
    <>
      {/* BreadcrumbList Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://earlymarketreports.com/'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Pricing',
                item: 'https://earlymarketreports.com/precios'
              }
            ]
          })
        }}
      />
      <PricingClient />
    </>
  );
}