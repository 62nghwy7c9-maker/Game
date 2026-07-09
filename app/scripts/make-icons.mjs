import { chromium } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'

const svg = readFileSync('/home/user/Game/app/public/icons/favicon.svg', 'utf8')

// Maskable: Motiv verkleinert auf sicherem Vollflächen-Hintergrund
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2563eb"/>
  <g transform="translate(51.2,51.2) scale(0.8)">${svg.replace(/<\/?svg[^>]*>/g, '')}</g>
</svg>`

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage()

async function shot(svgSrc, size, out) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<style>*{margin:0}</style><img src="data:image/svg+xml;base64,${Buffer.from(svgSrc).toString('base64')}" width="${size}" height="${size}">`,
  )
  const buf = await page.screenshot({ omitBackground: true })
  writeFileSync(out, buf)
  console.log('wrote', out)
}

await shot(svg, 192, '/home/user/Game/app/public/icons/icon-192.png')
await shot(svg, 512, '/home/user/Game/app/public/icons/icon-512.png')
await shot(maskable, 512, '/home/user/Game/app/public/icons/icon-maskable-512.png')
await browser.close()
