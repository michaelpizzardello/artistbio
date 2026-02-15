# Room Sheet PDF Generator (Local Tool)

This tool creates a printable exhibition room-sheet PDF on demand.

## What it does

- Optionally scrapes an exhibition page URL for base content (title/text/images)
- Merges scraped data with your own override JSON
- Renders a dedicated print layout
- Exports a PDF locally

## Command

```bash
npm run roomsheet -- --data examples/room-sheet.sample.json --out output/room-sheet.pdf
```

## With page scraping

```bash
npm run roomsheet -- \
  --url "https://your-site.com/exhibitions/your-show" \
  --data examples/room-sheet.sample.json \
  --out output/room-sheet.pdf \
  --html-out output/room-sheet.preview.html
```

Use `--data` to provide final pricing/details and contact info. The `--url` content is treated as a best-effort baseline.

## Options

- `--url <url>`: exhibition page URL to scrape
- `--data <path>`: manual/override JSON file
- `--out <path>`: output PDF path (default `output/room-sheet.pdf`)
- `--html-out <path>`: save generated HTML preview for quick visual checks
- `--format <A4|Letter>`: PDF paper format (default `A4`)
- `--timeout <ms>`: scrape navigation timeout (default `30000`)

## Data file shape

See `examples/room-sheet.sample.json`.

Key fields:

- `headingPrefix` (optional, defaults to `Exhibition`, e.g. `Group Exhibition`)
- `exhibitionTitle`, `artist`, `startDate`, `endDate`, `shortText`, `longText`
- `logoUrl`
- `contact.galleryName`, `contact.email`, `contact.phone`, `contact.address`, `contact.website`
- `artworks[]` with `title`, `image`, `medium`, `dimensions`, `year`, `edition`, `price`, `status`

## Notes

- This tool is for local/private use and does not add a website feature.
- If your exhibition page has custom markup, the scrape step may miss some fields. In that case, keep `--data` as the source of truth.
- For best print quality, use high-resolution artwork images.
