#!/usr/bin/env node
/**
 * new-customer — scaffold a white-label deployment for a new buyer.
 *
 *   make new-customer name="My Store"        (or: node scripts/new-customer.mjs "My Store")
 *
 * Creates customers/<slug>/ with a ready-to-edit brand.json + deploy checklist,
 * and prints the exact commands to build & launch that customer's store.
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const name = process.argv[2]

if (!name) {
  console.error('Usage: node scripts/new-customer.mjs "Store Name"')
  process.exit(1)
}

const slug =
  name
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'customer'

const dir = join(root, 'customers', slug)
if (existsSync(dir)) {
  console.error(`customers/${slug} already exists`)
  process.exit(1)
}

const template = JSON.parse(readFileSync(join(root, 'config', 'brand.json'), 'utf8'))
template.storeName = name
template.storeNameAr = name

mkdirSync(dir, { recursive: true })
writeFileSync(join(dir, 'brand.json'), JSON.stringify(template, null, 2) + '\n')

writeFileSync(
  join(dir, 'README.md'),
  `# ${name} — deployment checklist

## 1) Branding
Edit \`brand.json\` (name, colors, theme preset, taglines, logo URL, base currency).

## 2) Build the storefront with this brand
\`\`\`bash
cp customers/${slug}/brand.json config/brand.json
cd app
npm run brand           # writes app/.env from config/brand.json
npm run export          # or: npx expo export --platform web
\`\`\`

## 3) Backend
\`\`\`bash
cp env.production.example .env   # fill JWT_SECRET, DATABASE_URL, SMTP, CORS...
docker compose up -d --build
\`\`\`

## 4) First boot
- Open the admin panel → Settings: store contact, delivery fees, currencies.
- Disable demo products if AUTO_SEED=false was used.
- Verify demo-payments is OFF (production disables it automatically).

## 5) Sell it 🎉
`,
)

console.log(`✅ Scaffolded customers/${slug}/`)
console.log('   - brand.json   (edit per customer)')
console.log('   - README.md    (deploy checklist)')
console.log('')
console.log('Next:')
console.log(`   cp customers/${slug}/brand.json config/brand.json && cd app && npm run brand`)
