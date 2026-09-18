// White-label build-time injection:
// Reads config/brand.json and writes app/.env with EXPO_PUBLIC_* defaults.
// Runtime branding (Admin → Settings) always overrides these at load time.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const brandPath = resolve(root, 'config/brand.json')

if (!existsSync(brandPath)) {
  console.error('config/brand.json not found')
  process.exit(1)
}

const b = JSON.parse(readFileSync(brandPath, 'utf8'))
const lines = [
  '# Auto-generated from config/brand.json — do not edit by hand.',
  `EXPO_PUBLIC_STORE_NAME=${b.storeName ?? ''}`,
  `EXPO_PUBLIC_STORE_NAME_AR=${b.storeNameAr ?? ''}`,
  `EXPO_PUBLIC_TAGLINE_EN=${(b.taglineEn ?? '').replace(/\n/g, ' ')}`,
  `EXPO_PUBLIC_TAGLINE_AR=${(b.taglineAr ?? '').replace(/\n/g, ' ')}`,
  `EXPO_PUBLIC_PRIMARY_COLOR=${b.primaryColor ?? '#6C4DF6'}`,
  `EXPO_PUBLIC_THEME_PRESET=${b.themePreset ?? 'aurora'}`,
  `EXPO_PUBLIC_LOGO_URL=${b.logoUrl ?? ''}`,
  `EXPO_PUBLIC_ANNOUNCEMENT_EN=${(b.announcementEn ?? '').replace(/\n/g, ' ')}`,
  `EXPO_PUBLIC_ANNOUNCEMENT_AR=${(b.announcementAr ?? '').replace(/\n/g, ' ')}`,
  `EXPO_PUBLIC_BASE_CURRENCY=${b.baseCurrency ?? 'EGP'}`,
  // keep API URL if already set
]

const outPath = resolve(root, 'app/.env')
let prev = ''
if (existsSync(outPath)) {
  prev = readFileSync(outPath, 'utf8')
}
const apiLine = prev.split('\n').find((l) => l.startsWith('EXPO_PUBLIC_API_URL='))
if (apiLine) lines.push(apiLine)

writeFileSync(outPath, lines.join('\n') + '\n')
console.log('✅ Wrote', outPath)
