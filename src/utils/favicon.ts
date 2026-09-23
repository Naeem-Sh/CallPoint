/**
 * Utility for dynamically synchronizing browser tab favicon and title with the organization logo and name.
 */

const DEFAULT_FAVICON = '/favicon.svg';

/**
 * Creates a squared, properly padded favicon from any image (even wide horizontal logos)
 * so that Google Chrome and other browsers display it cleanly without distortion.
 */
function createSquareFaviconDataUrl(imageSrc: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      try {
        const size = 128; // high-resolution for crisp tabs
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        ctx.clearRect(0, 0, size, size);

        // Calculate aspect ratio containment with safe padding
        const imgWidth = img.naturalWidth || img.width;
        const imgHeight = img.naturalHeight || img.height;

        if (!imgWidth || !imgHeight) {
          resolve(imageSrc);
          return;
        }

        const padding = 6;
        const maxDrawWidth = size - padding * 2;
        const maxDrawHeight = size - padding * 2;

        const ratio = Math.min(maxDrawWidth / imgWidth, maxDrawHeight / imgHeight);
        const drawWidth = imgWidth * ratio;
        const drawHeight = imgHeight * ratio;

        const drawX = (size - drawWidth) / 2;
        const drawY = (size - drawHeight) / 2;

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch {
        resolve(imageSrc);
      }
    };

    img.onerror = () => {
      resolve(imageSrc);
    };

    img.src = imageSrc;
  });
}

function applyFaviconToDocument(href: string): void {
  // Select all existing icon link elements
  const existingLinks = document.querySelectorAll<HTMLLinkElement>(
    "link[rel*='icon'], link[rel='apple-touch-icon']"
  );

  // Remove existing links to force Chrome to re-render the tab icon immediately
  existingLinks.forEach((el) => el.remove());

  // Determine mime type
  let type = 'image/png';
  if (href.endsWith('.svg') || href.startsWith('data:image/svg+xml')) {
    type = 'image/svg+xml';
  } else if (href.endsWith('.ico') || href.startsWith('data:image/x-icon')) {
    type = 'image/x-icon';
  } else if (href.endsWith('.webp')) {
    type = 'image/webp';
  } else if (href.endsWith('.jpg') || href.endsWith('.jpeg')) {
    type = 'image/jpeg';
  }

  // 1. Primary rel="icon"
  const iconLink = document.createElement('link');
  iconLink.id = 'app-favicon';
  iconLink.rel = 'icon';
  iconLink.type = type;
  iconLink.href = href;
  document.head.appendChild(iconLink);

  // 2. Shortcut icon for legacy browsers
  const shortcutLink = document.createElement('link');
  shortcutLink.rel = 'shortcut icon';
  shortcutLink.type = type;
  shortcutLink.href = href;
  document.head.appendChild(shortcutLink);

  // 3. Apple Touch Icon for iOS/macOS Safari and bookmarks
  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = href;
  document.head.appendChild(appleLink);
}

/**
 * Updates the browser tab's favicon and optionally tab title.
 * @param logoUrl Path or URL to the organization logo (null to reset to default)
 * @param organizationName Optional organization title to reflect in the tab
 */
export async function updateTabFaviconAndTitle(
  logoUrl?: string | null,
  organizationName?: string | null
): Promise<void> {
  // Update document title if organization name is provided
  if (organizationName && organizationName.trim()) {
    const trimmed = organizationName.trim();
    const targetTitle = `${trimmed} | دفتر تلفن`;
    if (document.title !== targetTitle && !document.title.includes('پیش‌نمایش چاپ')) {
      document.title = targetTitle;
    }
  }

  const rawUrl = logoUrl && logoUrl.trim() ? logoUrl.trim() : null;

  if (!rawUrl) {
    applyFaviconToDocument(DEFAULT_FAVICON);
    return;
  }

  // For immediate feedback in Chrome, apply raw URL first
  applyFaviconToDocument(rawUrl);

  // If the image is not an SVG, create a squared version so it fits Chrome tab dimensions perfectly
  if (!rawUrl.endsWith('.svg') && !rawUrl.startsWith('data:image/svg+xml')) {
    try {
      const squareDataUrl = await createSquareFaviconDataUrl(rawUrl);
      if (squareDataUrl && squareDataUrl !== rawUrl) {
        applyFaviconToDocument(squareDataUrl);
      }
    } catch {
      // already applied rawUrl
    }
  }
}
