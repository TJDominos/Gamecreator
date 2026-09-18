export const DEFAULT_SHARE_IMAGE_URL = "https://storage.randseed.org/Thumbnail/HomeThumbnail.jpg";

export interface ShareMetadata {
  title: string;
  description: string;
  url: string;
  image: string;
  imageType?: string;
}

const managedHeadTagPatterns = [
  /<!-- route-meta:start -->[\s\S]*?<!-- route-meta:end -->\s*/gi,
  /<title\b[^>]*>[\s\S]*?<\/title>\s*/gi,
  /<meta\b(?=[^>]*\bname=["']description["'])[^>]*>\s*/gi,
  /<meta\b(?=[^>]*\bproperty=["']og:[^"']+["'])[^>]*>\s*/gi,
  /<meta\b(?=[^>]*\bname=["']twitter:[^"']+["'])[^>]*>\s*/gi,
  /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>\s*/gi,
];

function escapeHtml(value: string): string {
  return value.replace(/[&<>\"]/g, (character) => {
    switch (character) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "\"": return "&quot;";
      default: return character;
    }
  });
}

function imageTypeFromUrl(url: URL): string | undefined {
  const extension = url.pathname.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    avif: "image/avif",
    gif: "image/gif",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  return extension ? types[extension] : undefined;
}

function isVideoUrl(url: URL): boolean {
  return /\.(?:m4v|mov|mp4|webm)$/i.test(url.pathname);
}

export function resolveShareImage(rawImage: string | null | undefined, requestUrl: string): {
  url: string;
  type?: string;
} {
  if (rawImage) {
    try {
      const imageUrl = new URL(rawImage, requestUrl);
      if (["http:", "https:"].includes(imageUrl.protocol) && !isVideoUrl(imageUrl)) {
        return { url: imageUrl.toString(), type: imageTypeFromUrl(imageUrl) };
      }
    } catch {
    }
  }

  return { url: DEFAULT_SHARE_IMAGE_URL, type: "image/jpeg" };
}

export function renderShareMetadataHtml(templateHtml: string, metadata: ShareMetadata): string {
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);
  const url = escapeHtml(metadata.url);
  const image = escapeHtml(metadata.image);
  const imageType = metadata.imageType ? `\n  <meta property="og:image:type" content="${escapeHtml(metadata.imageType)}" />` : "";
  const managedBlock = [
    "  <!-- bounty-meta:start -->",
    `  <title>${title}</title>`,
    `  <meta name="description" content="${description}" />`,
    `  <link rel="canonical" href="${url}" />`,
    `  <meta property="og:title" content="${title}" />`,
    `  <meta property="og:description" content="${description}" />`,
    '  <meta property="og:type" content="website" />',
    `  <meta property="og:url" content="${url}" />`,
    `  <meta property="og:image" content="${image}" />`,
    '  <meta property="og:image:width" content="1200" />',
    '  <meta property="og:image:height" content="630" />',
    `  <meta property="og:image:alt" content="${title}" />${imageType}`,
    '  <meta name="twitter:card" content="summary_large_image" />',
    `  <meta name="twitter:title" content="${title}" />`,
    `  <meta name="twitter:description" content="${description}" />`,
    `  <meta name="twitter:image" content="${image}" />`,
    "  <!-- bounty-meta:end -->",
  ].join("\n");

  return templateHtml.replace(/<head\b([^>]*)>([\s\S]*?)<\/head>/i, (_match, attributes: string, headContent: string) => {
    let cleanedHead = headContent;
    for (const pattern of managedHeadTagPatterns) cleanedHead = cleanedHead.replace(pattern, "");
    return `<head${attributes}>${cleanedHead.trim()}\n${managedBlock}\n</head>`;
  });
}