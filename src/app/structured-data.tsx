import Script from 'next/script'

export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "CUXSNACK Slot Machine",
    "applicationCategory": "GameApplication",
    "operatingSystem": "All",
    "description": "Drehe die Walzen bei der CUXSNACK Slot Machine und gewinne tolle Snack-Preise wie Takis, Doritos, Calypso oder den 100€ Jackpot!",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR"
    },
    "author": {
      "@type": "Person",
      "name": "Diego Rodriguez"
    },
    "inLanguage": "de-DE",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "24"
    },
    "potentialAction": {
      "@type": "PlayAction",
      "target": "https://cuxsnack.de/"
    }
  };

  return (
    <Script id="structured-data" type="application/ld+json">
      {JSON.stringify(structuredData)}
    </Script>
  );
}
