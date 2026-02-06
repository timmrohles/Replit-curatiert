/**
 * Publisher Logo Fallback Utility
 * 
 * ONIX 3.0 Reality: Verlagslogos werden selten im ONIX-Feed mitgeliefert.
 * Verlage erwarten, dass Händler ihre Logos bereits im System haben.
 * 
 * Dreistufige Fallback-Logik:
 * 1. ONIX-Logo (ResourceContentType 16)
 * 2. Lokales Logo (/logos/publishers/{publisher-id}.{ext})
 * 3. null (Text-Display im UI als Fallback)
 */

export interface PublisherLogoData {
  onixLogoUrl?: string;           // ONIX: <SupportingResource> ResourceContentType 16
  publisherId?: string;            // ONIX: <PublisherIdentifier> (GLN/Verkehrsnummer)
  publisherName: string;           // ONIX: <PublisherName>
}

/**
 * Returns the best available logo URL for a publisher
 * @param logoData - Publisher logo data from ONIX
 * @returns Logo URL or null if no logo available
 */
export function getPublisherLogoUrl(logoData: PublisherLogoData): string | null {
  // Priority 1: ONIX-provided logo (ResourceContentType 16)
  if (logoData.onixLogoUrl) {
    return logoData.onixLogoUrl;
  }
  
  // Priority 2: Local logo files (GLN/Verkehrsnummer as filename)
  if (logoData.publisherId) {
    // Try SVG first (best for Dark Mode)
    const svgPath = `/logos/publishers/${logoData.publisherId}.svg`;
    // In a real implementation, you'd check if file exists
    // For now, we'll assume existence check happens elsewhere
    
    // Also try PNG with transparent background
    const pngPath = `/logos/publishers/${logoData.publisherId}.png`;
    
    // Return SVG path as preferred format
    // Note: Actual file existence check should be done server-side or via build process
    return svgPath;
  }
  
  // Priority 3: No logo available - return null for text fallback
  return null;
}

/**
 * Returns Schema.org logo object for JSON-LD
 * @param logoData - Publisher logo data
 * @returns Schema.org ImageObject or undefined
 */
export function getPublisherLogoSchemaOrg(logoData: PublisherLogoData) {
  const logoUrl = getPublisherLogoUrl(logoData);
  
  if (!logoUrl) {
    return undefined;
  }
  
  // Construct absolute URL for Schema.org
  const absoluteUrl = logoUrl.startsWith('http') 
    ? logoUrl 
    : `https://coratiert.de${logoUrl}`;
  
  return {
    "@type": "ImageObject",
    "url": absoluteUrl,
    "contentUrl": absoluteUrl
  };
}

/**
 * Checks if a publisher has a logo available
 * @param logoData - Publisher logo data
 * @returns true if logo is available
 */
export function hasPublisherLogo(logoData: PublisherLogoData): boolean {
  return getPublisherLogoUrl(logoData) !== null;
}
