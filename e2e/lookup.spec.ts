import { expect, test, type Locator } from '@playwright/test'

async function longPress(target: Locator) {
  const box = await target.boundingBox()
  if (!box) throw new Error('word not visible')
  const point = { pointerType: 'touch', isPrimary: true, clientX: box.x + 4, clientY: box.y + box.height - 8 }
  await target.dispatchEvent('pointerdown', point)
  await target.page().waitForTimeout(600)
  await target.dispatchEvent('pointerup', point)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Paste a Chinese article').fill('我去银行取钱。国家铁路局发布了规划。')
  await page.getByRole('button', { name: 'Read' }).click()
})

test('long-pressing a word shows its meaning and saves it', async ({ page }) => {
  await longPress(page.locator('[data-word="规划"]'))
  const sheet = page.getByRole('dialog', { name: 'Meaning of 规划' })
  await expect(sheet).toBeVisible()
  await expect(sheet).toContainText('guī huà')
  await expect(sheet).toContainText('HSK 6')
  await expect(sheet.locator('mark')).toHaveText('规划')

  await sheet.getByRole('button', { name: 'Add to Anki' }).click()
  await expect(sheet.getByRole('button', { name: 'Saved ✓' })).toBeVisible()
})

test('a compound missing from the dictionary is explained by its parts', async ({ page }) => {
  await longPress(page.locator('[data-word="铁路局"]'))
  const sheet = page.getByRole('dialog', { name: 'Meaning of 铁路局' })
  await expect(sheet).toContainText('Its parts')
  await expect(sheet).toContainText('railroad')
})

test('"I know this" hides the pinyin for that word', async ({ page }) => {
  const word = page.locator('[data-word="规划"]')
  await expect(word.locator('rt')).toHaveCount(1)
  await longPress(word)
  await page.getByRole('button', { name: 'Hide pinyin' }).click()
  await page.keyboard.press('Escape')
  await expect(word.locator('rt')).toHaveCount(0)
})
