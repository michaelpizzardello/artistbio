#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toPrettyDate(input) {
  if (!input) return '';
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return input;
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateRange(start, end, fallback = '') {
  const s = toPrettyDate(start);
  const e = toPrettyDate(end);
  if (s && e) return `${s} - ${e}`;
  if (s) return s;
  if (e) return e;
  return fallback;
}

function normalizeArtworks(artworks = []) {
  if (!Array.isArray(artworks)) return [];
  return artworks
    .map((item, index) => {
      const title = item?.title || `Artwork ${index + 1}`;
      const details = [item?.medium, item?.dimensions, item?.year].filter(Boolean).join(' · ');
      return {
        image: item?.image || item?.imageUrl || '',
        alt: item?.alt || title,
        title,
        artist: item?.artist || '',
        medium: item?.medium || '',
        dimensions: item?.dimensions || '',
        year: item?.year || '',
        edition: item?.edition || '',
        price: item?.price || item?.priceLabel || '',
        status: item?.status || '',
        details,
      };
    })
    .filter((item) => item.title || item.image || item.details || item.price);
}

function mergeData(scraped = {}, override = {}) {
  return {
    headingPrefix: override.headingPrefix || scraped.headingPrefix || 'Exhibition',
    exhibitionTitle: override.exhibitionTitle || scraped.exhibitionTitle || '',
    artist: override.artist || scraped.artist || '',
    startDate: override.startDate || scraped.startDate || '',
    endDate: override.endDate || scraped.endDate || '',
    dateLabel:
      override.dateLabel ||
      formatDateRange(override.startDate || scraped.startDate, override.endDate || scraped.endDate, scraped.dateLabel || ''),
    shortText: override.shortText || scraped.shortText || '',
    longText: override.longText || scraped.longText || '',
    logoUrl: override.logoUrl || scraped.logoUrl || '',
    fontUrls: Array.isArray(scraped.fontUrls) ? scraped.fontUrls : [],
    contact: {
      galleryName: override.contact?.galleryName || scraped.contact?.galleryName || '',
      email: override.contact?.email || scraped.contact?.email || '',
      phone: override.contact?.phone || scraped.contact?.phone || '',
      address: override.contact?.address || scraped.contact?.address || '',
      website: override.contact?.website || scraped.contact?.website || '',
    },
    artworks: normalizeArtworks(override.artworks?.length ? override.artworks : scraped.artworks),
  };
}

function buildHtml(data) {
  const fontFace = '';
  const renderArtwork = (artwork) => {
      const artistLine = artwork.artist ? `<div class="line line-artist">${escapeHtml(artwork.artist)}</div>` : '';
      const titleLine = artwork.title
        ? `<div class="line line-title"><span class="title-italic">${escapeHtml(artwork.title)}</span>${artwork.year ? `<span>, ${escapeHtml(artwork.year)}</span>` : ''}</div>`
        : artwork.year
          ? `<div class="line line-title">${escapeHtml(artwork.year)}</div>`
          : '';
      const mediumLine = artwork.medium ? `<div class="line">${escapeHtml(artwork.medium)}</div>` : '';
      const dimensionsLine = artwork.dimensions ? `<div class="line">${escapeHtml(artwork.dimensions)}</div>` : '';
      const priceLine = artwork.price ? `<div class="line">${escapeHtml(artwork.price)}</div>` : '';

    return `
      <article class="artwork-item">
        <div class="thumb-wrap">
          ${
            artwork.image
              ? `<img class="thumb" src="${escapeHtml(artwork.image)}" alt="${escapeHtml(artwork.alt || artwork.title)}" />`
              : '<div class="thumb-placeholder">No image</div>'
          }
        </div>
        <div class="item-copy">
          ${artistLine}
          ${titleLine}
          <div class="line-stack">
            ${mediumLine}
            ${dimensionsLine}
            ${priceLine}
          </div>
        </div>
      </article>
    `;
  };

  const rowsPerPage = 6;
  const columnsPerPage = 2;
  const itemsPerPage = rowsPerPage * columnsPerPage;
  const artworkChunks = [];
  for (let i = 0; i < data.artworks.length; i += itemsPerPage) {
    artworkChunks.push(data.artworks.slice(i, i + itemsPerPage));
  }
  if (!artworkChunks.length) artworkChunks.push([]);

  const contactLines = [
    data.contact.galleryName,
    data.contact.email,
    data.contact.phone,
    data.contact.address,
    data.contact.website,
  ].filter(Boolean);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Room Sheet</title>
  <style>
    ${fontFace}

    @page {
      size: A4;
      margin: 14mm 14mm 16mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: "Beausite", "Beausite Fallback", "Bausite", "Bausite Fallback", Arial, "Helvetica Neue", Helvetica, sans-serif;
      margin: 0;
      color: #151515;
      font-size: 10pt;
      line-height: 1.35;
      background: #fff;
      font-style: normal;
    }

    .sheet {
      display: block;
    }

    .sheet-page {
      min-height: calc(297mm - 30mm);
      display: flex;
      flex-direction: column;
      gap: 10px;
      page-break-after: always;
      break-after: page;
    }

    .sheet-page:last-of-type {
      page-break-after: auto;
      break-after: auto;
    }

    .header {
      padding-top: 2px;
    }

    h1 {
      margin: 0;
      font-size: 32px;
      line-height: 1.08;
      font-weight: 600;
      letter-spacing: -0.012em;
    }

    .title-prefix {
      font-weight: 600;
    }

    .title-value {
      font-style: italic;
      font-weight: 500;
    }

    .header-meta {
      margin-top: 12px;
      display: flex;
      gap: 12px;
      color: #222;
      font-size: 18px;
      line-height: 1.2;
      font-weight: 400;
    }

    .intro-copy {
      margin: 12px 0 0;
      font-size: 15px;
      line-height: 1.32;
      color: #222;
      max-width: 96%;
    }

    .artworks-page {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px 34px;
      align-content: start;
      margin-top: 2px;
    }

    .artwork-item {
      display: grid;
      grid-template-columns: 104px minmax(0, 1fr);
      gap: 12px;
      align-items: start;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .thumb-wrap {
      width: 104px;
      height: 104px;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .thumb {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
      display: block;
    }

    .thumb-placeholder {
      color: #777;
      font-size: 8pt;
    }

    .line-stack {
      margin-top: 1px;
      display: grid;
      gap: 1px;
    }

    .line {
      font-size: 11.3px;
      color: #222;
      line-height: 1.24;
      font-style: normal;
    }

    .line-artist {
      font-weight: 700;
      margin-bottom: 1px;
    }

    .line-title {
      margin-top: 1px;
    }

    .title-italic {
      font-style: italic;
    }

    .footer {
      margin-top: auto;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 18px;
      page-break-inside: avoid;
    }

    .logo img {
      max-height: 30px;
      width: auto;
      display: block;
    }

    .logo-fallback {
      font-size: 12px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #1f1f1f;
      font-weight: 600;
    }

    .contact {
      text-align: right;
      font-size: 10px;
      line-height: 1.5;
      color: #333;
    }

    .contact-line {
      white-space: normal;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <main class="sheet">
    ${artworkChunks
      .map((chunk, chunkIndex) => {
        const artworkMarkup = chunk.map(renderArtwork).join('');
        const showIntro = chunkIndex === 0;
        const isLast = chunkIndex === artworkChunks.length - 1;
        return `
          <section class="sheet-page">
            <header class="header">
              <h1>
                <span class="title-prefix">${escapeHtml(data.headingPrefix || 'Exhibition')}:</span>
                <span class="title-value">${escapeHtml(data.exhibitionTitle || 'Untitled Exhibition')}</span>
              </h1>
              <div class="header-meta">
                ${data.dateLabel ? `<div>${escapeHtml(data.dateLabel)}</div>` : data.artist ? `<div>${escapeHtml(data.artist)}</div>` : ''}
              </div>
              ${showIntro && (data.shortText || data.longText) ? `<div class="intro-copy">${escapeHtml(data.shortText || data.longText || '')}</div>` : ''}
            </header>
            <section class="artworks-page">${artworkMarkup || '<p>No artworks found.</p>'}</section>
            ${
              `<footer class="footer">
                <div class="logo">
                  ${
                    data.logoUrl
                      ? `<img src="${escapeHtml(data.logoUrl)}" alt="Gallery logo" />`
                      : `<div class="logo-fallback">${escapeHtml(data.contact.galleryName || 'Gallery')}</div>`
                  }
                </div>
                <div class="contact">
                  <div class="contact-line">${contactLines.map((line) => escapeHtml(line)).join(' | ')}</div>
                </div>
              </footer>`
            }
          </section>
        `;
      })
      .join('')}
  </main>
</body>
</html>`;
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function timestampForFile(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function archiveDirectoryFiles({ directory }) {
  const absDirectory = path.resolve(directory);
  const archiveDir = path.join(absDirectory, 'Archive');
  await fs.mkdir(archiveDir, { recursive: true });

  const entries = await fs.readdir(absDirectory, { withFileTypes: true });
  const stamp = timestampForFile();

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const src = path.join(absDirectory, entry.name);
    const archivedName = `${stamp}-${entry.name}`;
    const dest = path.join(archiveDir, archivedName);
    await fs.rename(src, dest);
  }
}

async function readLocalLogoDataUri() {
  const logoPath = path.resolve('./public/logo-black.svg');
  try {
    const svg = await fs.readFile(logoPath, 'utf8');
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  } catch {
    return '';
  }
}

async function scrapeExhibitionPage(url, timeoutMs = 30000) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: timeoutMs });
    const data = await page.evaluate(async () => {
      const cleanPrice = (priceLabel) => {
        if (!priceLabel) return '';
        return String(priceLabel).replace(/^\$\$/, '$').trim();
      };

      const tryParseJson = (raw) => {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      };

      const flightChunks = Array.isArray(self.__next_f) ? self.__next_f : [];
      const textChunks = flightChunks
        .flatMap((entry) => (Array.isArray(entry) ? entry.slice(1) : []))
        .filter((item) => typeof item === 'string');
      const joined = textChunks.join('\n');

      let availableArtworks = [];
      const availableMatch = joined.match(/"title":"Available Works","exhibitionHandle":"[^"]+","artworks":(\[[\s\S]*?\]),"rows":/);
      if (availableMatch?.[1]) {
        const parsed = tryParseJson(availableMatch[1]);
        if (Array.isArray(parsed)) {
          availableArtworks = parsed;
        }
      }

      // Fallback to first artworks array in the payload if "Available Works" is absent.
      if (!availableArtworks.length) {
        const anyArtworksMatch = joined.match(/"artworks":(\[[\s\S]*?\]),"rows":/);
        if (anyArtworksMatch?.[1]) {
          const parsed = tryParseJson(anyArtworksMatch[1]);
          if (Array.isArray(parsed)) {
            availableArtworks = parsed;
          }
        }
      }

      const detailEntries = await Promise.all(
        availableArtworks.map(async (item) => {
          const handle = item?.handle;
          if (!handle) return [handle, null];
          try {
            const response = await fetch(`/artworks/${encodeURIComponent(handle)}`);
            if (!response.ok) return [handle, null];
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
              .map((node) => node.textContent || '')
              .filter(Boolean)
              .map((raw) => tryParseJson(raw))
              .filter(Boolean);

            const artworkLd = scripts.find((entry) => {
              const type = entry?.['@type'];
              if (Array.isArray(type)) return type.includes('VisualArtwork');
              return type === 'VisualArtwork' || type === 'Product';
            });
            if (!artworkLd) return [handle, null];

            const width = artworkLd?.size?.width;
            const height = artworkLd?.size?.height;
            const dimensions = width && height ? `${width} x ${height} cm` : '';
            const offerPrice = artworkLd?.offers?.price ? `$${Number(artworkLd.offers.price).toLocaleString('en-US')}` : '';

            return [
              handle,
              {
                artist: artworkLd?.creator?.name || '',
                medium: artworkLd?.artMedium || '',
                dimensions,
                price: offerPrice,
              },
            ];
          } catch {
            return [handle, null];
          }
        })
      );

      const detailByHandle = Object.fromEntries(detailEntries.filter((entry) => entry?.[0] && entry?.[1]));

      const artworks = availableArtworks.map((item) => {
        const detail = detailByHandle[item?.handle] || {};
        return {
          image: item?.featureImage?.url || '',
          alt: item?.featureImage?.altText || item?.title || '',
          title: item?.title || '',
          artist: detail?.artist || item?.artist || '',
          medium: detail?.medium || '',
          dimensions: detail?.dimensions || '',
          year: item?.year ? String(item.year) : '',
          edition: '',
          price: cleanPrice(item?.priceLabel || detail?.price || ''),
          status: item?.sold ? 'Sold' : item?.canPurchase ? 'Available' : '',
        };
      });

      const shortLongMatch = joined.match(/"shortText":"([\s\S]*?)","longTextHtml":"([\s\S]*?)","clampLines":/);
      const shortText = shortLongMatch?.[1] ? JSON.parse(`"${shortLongMatch[1]}"`) : '';
      const longTextHtml = shortLongMatch?.[2] ? JSON.parse(`"${shortLongMatch[2]}"`) : '';
      const tmp = document.createElement('div');
      tmp.innerHTML = (longTextHtml || '').replace(/<\/p>/gi, '</p>\n');
      const longText = (tmp.textContent || '').replace(/\n\s*\n/g, '\n\n').trim();

      const ldJsonNodes = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map((node) => node.textContent || '')
        .filter(Boolean)
        .map((raw) => tryParseJson(raw))
        .filter(Boolean);
      const fontUrls = Array.from(document.querySelectorAll('link[rel="preload"][as="font"]'))
        .map((node) => node.getAttribute('href') || '')
        .filter(Boolean)
        .map((href) => {
          try {
            return new URL(href, window.location.origin).href;
          } catch {
            return href;
          }
        });
      const exhibitionEvent = ldJsonNodes.find((item) => item?.['@type'] === 'ExhibitionEvent') || null;
      const galleryProfile = ldJsonNodes.find((item) => item?.['@type'] === 'ArtGallery') || null;

      const eventName = exhibitionEvent?.name || '';
      const performerName = (exhibitionEvent?.performer?.name || '').trim();
      const eventPrefix = eventName.includes(':') ? eventName.split(':')[0].trim() : '';
      const isGroupExhibition = /group exhibition/i.test(`${eventPrefix} ${performerName}`);
      const headingPrefix = isGroupExhibition
        ? 'Group Exhibition'
        : performerName || eventPrefix || 'Exhibition';
      const exhibitionTitle = eventName.includes(':')
        ? eventName.split(':').slice(1).join(':').trim()
        : (document.querySelector('meta[property="og:title"]')?.getAttribute('content') || document.title || '');

      return {
        headingPrefix,
        exhibitionTitle,
        artist: performerName,
        startDate: exhibitionEvent?.startDate || '',
        endDate: exhibitionEvent?.endDate || '',
        dateLabel: '',
        shortText: shortText || '',
        longText: longText || '',
        logoUrl: galleryProfile?.logo || '',
        contact: {
          galleryName: galleryProfile?.name || '',
          phone: galleryProfile?.telephone || '',
          address: galleryProfile?.address
            ? [
                galleryProfile.address.streetAddress,
                galleryProfile.address.addressLocality,
                galleryProfile.address.addressRegion,
                galleryProfile.address.postalCode,
              ]
                .filter(Boolean)
                .join(', ')
            : '',
          website: galleryProfile?.url || '',
          email: '',
        },
        fontUrls,
        artworks,
      };
    });

    return data;
  } finally {
    await browser.close();
  }
}

function usage() {
  return `
Usage:
  node scripts/generate-room-sheet.mjs --url <exhibition-url> [options]
  node scripts/generate-room-sheet.mjs --data <override-json> [options]

Options:
  --url <url>             Exhibition page URL to scrape
  --data <path>           JSON file with manual/override data
  --out <path>            Output PDF path (default: ./output/room-sheet.pdf)
  --html-out <path>       Optional path to save generated HTML preview
  --data-out <path>       Optional path to save parsed/merged JSON payload
  --format <A4|Letter>    PDF format (default: A4)
  --timeout <ms>          Navigation timeout for scraping (default: 30000)

Data JSON shape:
{
  "headingPrefix": "Group Exhibition",
  "exhibitionTitle": "...",
  "artist": "...",
  "startDate": "2026-03-05",
  "endDate": "2026-04-18",
  "dateLabel": "optional string override",
  "shortText": "...",
  "longText": "...",
  "logoUrl": "https://... or file:///...",
  "contact": {
    "galleryName": "...",
    "email": "...",
    "phone": "...",
    "address": "...",
    "website": "..."
  },
  "artworks": [
    {
      "title": "...",
      "image": "...",
      "medium": "...",
      "dimensions": "...",
      "year": "...",
      "edition": "...",
      "price": "...",
      "status": "..."
    }
  ]
}
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url && !args.data) {
    process.stderr.write(usage());
    process.exit(1);
  }

  const outputPath = path.resolve(args.out || './output/room-sheet.pdf');
  const htmlOutputPath = args['html-out'] ? path.resolve(args['html-out']) : '';
  const dataOutputPath = args['data-out'] ? path.resolve(args['data-out']) : '';
  const pdfFormat = String(args.format || 'A4');
  const timeoutMs = Number(args.timeout || 30000);

  let scraped = {};
  if (args.url) {
    scraped = await scrapeExhibitionPage(String(args.url), timeoutMs);
  }

  let override = {};
  if (args.data) {
    override = await readJson(path.resolve(String(args.data)));
  }

  const data = mergeData(scraped, override);
  const localLogoDataUri = await readLocalLogoDataUri();
  if (!override.logoUrl && localLogoDataUri) {
    data.logoUrl = localLogoDataUri;
  }
  if (!data.exhibitionTitle) {
    throw new Error('Could not determine exhibition title. Provide --data with exhibitionTitle.');
  }

  const html = buildHtml(data);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await archiveDirectoryFiles({
    directory: path.dirname(outputPath),
  });
  if (htmlOutputPath) {
    await fs.mkdir(path.dirname(htmlOutputPath), { recursive: true });
    await fs.writeFile(htmlOutputPath, html, 'utf8');
  }
  if (dataOutputPath) {
    await fs.mkdir(path.dirname(dataOutputPath), { recursive: true });
    await fs.writeFile(dataOutputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.pdf({
      path: outputPath,
      format: pdfFormat,
      printBackground: true,
    });
  } finally {
    await browser.close();
  }

  // After publish, keep only the latest PDF at output root.
  const outputDir = path.dirname(outputPath);
  const files = await fs.readdir(outputDir, { withFileTypes: true });
  const archiveDir = path.join(outputDir, 'Archive');
  await fs.mkdir(archiveDir, { recursive: true });
  const stamp = timestampForFile();
  for (const entry of files) {
    if (!entry.isFile()) continue;
    const filePath = path.join(outputDir, entry.name);
    if (path.resolve(filePath) === path.resolve(outputPath)) continue;
    const dest = path.join(archiveDir, `${stamp}-${entry.name}`);
    if (await pathExists(dest)) {
      await fs.rename(filePath, path.join(archiveDir, `${stamp}-${Math.random().toString(16).slice(2)}-${entry.name}`));
    } else {
      await fs.rename(filePath, dest);
    }
  }

  process.stdout.write(`Room sheet PDF generated: ${outputPath}\n`);
  if (htmlOutputPath) {
    process.stdout.write(`HTML preview saved: ${htmlOutputPath}\n`);
  }
  if (dataOutputPath) {
    process.stdout.write(`Data payload saved: ${dataOutputPath}\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || String(error)}\n`);
  process.exit(1);
});
