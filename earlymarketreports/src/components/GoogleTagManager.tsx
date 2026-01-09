const GTM_ID = "GTM-PVZFJ4WV";

/**
 * Google Tag Manager component
 * This component should be included in the root layout to ensure GTM loads on all pages
 * The script is injected directly into the head via the layout for optimal loading
 */
export default function GoogleTagManager() {
  return (
    <>
      {/* Google Tag Manager (noscript) - Fallback for users with JavaScript disabled */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}

/**
 * Google Tag Manager script for head section
 * This should be added to the <head> tag in layout.tsx
 */
export function GoogleTagManagerScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
      }}
    />
  );
}
