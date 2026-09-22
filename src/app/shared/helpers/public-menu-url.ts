import { environment } from '../../../environments/environment';

/**
 * The public menu URL for a restaurant slug — what the printed QR code
 * encodes. In production this is a real subdomain of the wildcard domain
 * (landing); locally there's no real subdomain to resolve, so it falls back
 * to landing's dev server with the slug as a query param instead.
 */
export function buildPublicMenuUrl(slug: string): string {
  if (environment.production) {
    return `https://${slug}.${environment.publicMenuDomain}`;
  }
  return `http://${environment.publicMenuDomain}/menu?slug=${encodeURIComponent(slug)}`;
}
