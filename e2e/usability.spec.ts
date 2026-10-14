import { expect, test, type Locator } from '@playwright/test'

async function longPress(target: Locator) {
  const box = await target.boundingBox()
  if (!box) throw new Error('word not visible')
  const point = { pointerType: 'touch', isPrimary: true, clientX: box.x + 4, clientY: box.y + box.height - 8 }
  await target.dispatchEvent('pointerdown', point)
  await target.page().waitForTimeout(600)
  await target.dispatchEvent('pointerup', point)
}

async function read(page: import('@playwright/test').Page, text: string, title = '') {
  await page.getByLabel('Paste a Chinese article').fill(text)
  if (title) await page.getByLabel('Title (optional)').fill(title)
  await page.getByRole('button', { name: 'Read' }).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('the title shows above the article and past articles can be reopened', async ({ page }) => {
  await read(page, '国家铁路局发布了规划。', '铁路新闻')
  await expect(page.getByRole('heading', { name: '铁路新闻' })).toBeVisible()

  await page.getByRole('button', { name: 'New article' }).click()
  await read(page, '我去银行取钱。')
  await page.getByRole('button', { name: 'New article' }).click()

  const recent = page.getByRole('region', { name: 'Recent articles' })
  await recent.getByRole('button', { name: '铁路新闻' }).click()
  await expect(page.locator('.reader [data-word="规划"]')).toBeVisible()
})

test('pinyin can be hidden for the whole page and the text resized', async ({ page }) => {
  await read(page, '国家铁路局发布了规划。')
  const reader = page.locator('.reader')
  await expect(reader.locator('rt').first()).toBeVisible()

  await page.getByRole('button', { name: 'Hide all pinyin' }).click()
  await expect(reader.locator('rt')).toHaveCount(0)
  await page.getByRole('button', { name: 'Show all pinyin' }).click()
  await expect(reader.locator('rt').first()).toBeVisible()

  await page.getByRole('button', { name: 'Larger text' }).click()
  await expect(reader).toHaveClass(/reader--l/)
})

test('removing a saved word can be undone', async ({ page }) => {
  await read(page, '国家铁路局发布了规划。')
  await longPress(page.locator('[data-word="规划"]'))
  const sheet = page.getByRole('dialog', { name: 'Meaning of 规划' })
  await sheet.getByRole('button', { name: 'Add to Anki' }).click()
  await sheet.getByRole('button', { name: 'Saved ✓' }).click()

  await expect(page.getByRole('button', { name: 'Saved (0)' })).toBeVisible()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByRole('button', { name: 'Saved (1)' })).toBeVisible()
})

test('saved words show their sentence, and pinyin marks can be reset', async ({ page }) => {
  await read(page, '国家铁路局发布了规划。')
  const word = page.locator('[data-word="规划"]')
  await longPress(word)
  const sheet = page.getByRole('dialog', { name: 'Meaning of 规划' })
  await sheet.getByRole('button', { name: 'Add to Anki' }).click()
  await sheet.getByRole('button', { name: 'Hide pinyin' }).click()
  await page.keyboard.press('Escape')
  await expect(word.locator('rt')).toHaveCount(0)

  await page.getByRole('button', { name: 'Saved (1)' }).click()
  const panel = page.getByRole('dialog', { name: 'Saved words' })
  await expect(panel.locator('.saved-list__sentence')).toContainText('国家铁路局发布了规划')
  await panel.getByRole('button', { name: 'Reset to HSK level' }).click()
  await panel.getByRole('button', { name: 'Close' }).click()
  await expect(word.locator('rt')).toHaveCount(1)
})
