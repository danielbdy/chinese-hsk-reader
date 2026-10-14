import { expect, test } from '@playwright/test'
import { unzipSync } from 'fflate'
import { readFileSync } from 'node:fs'

test('saved words download as an Anki package', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Paste a Chinese article').fill('国家铁路局发布了规划。')
  await page.getByRole('button', { name: 'Read' }).click()

  const word = page.locator('[data-word="规划"]')
  const box = await word.boundingBox()
  const point = { pointerType: 'touch', isPrimary: true, clientX: box!.x + 4, clientY: box!.y + box!.height - 8 }
  await word.dispatchEvent('pointerdown', point)
  await page.waitForTimeout(600)
  await word.dispatchEvent('pointerup', point)
  await page.getByRole('button', { name: 'Add to Anki' }).click()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Saved (1)' }).click()
  const panel = page.getByRole('dialog', { name: 'Saved words' })
  await expect(panel).toContainText('规划')

  const downloading = page.waitForEvent('download')
  await panel.getByRole('button', { name: 'Download .apkg' }).click()
  const file = await downloading
  expect(file.suggestedFilename()).toMatch(/^hsk-reader-\d{4}-\d{2}-\d{2}\.apkg$/)
  const zip = unzipSync(new Uint8Array(readFileSync(await file.path())))
  expect(Object.keys(zip).sort()).toEqual(['collection.anki2', 'media'])
})
