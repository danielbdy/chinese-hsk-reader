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

test('long-pressing a word shows its meaning and adds it to flashcards', async ({ page }) => {
  const word = page.locator('[data-word="规划"]')
  await expect(word.locator('rt')).toHaveCount(0)
  await longPress(word)
  const sheet = page.getByRole('dialog', { name: 'Meaning of 规划' })
  await expect(sheet).toBeVisible()
  await expect(sheet).toContainText('guī huà')
  await expect(sheet).toContainText('HSK 6')
  await expect(sheet.locator('mark')).toHaveText('规划')

  await expect(sheet).toContainText('Added to your flashcards ✓')
  await page.keyboard.press('Escape')
  // The tapped word keeps its pinyin and shows its HSK level in the corner.
  await expect(word.locator('rt')).toHaveText('guī huà')
  await expect(word.locator('.word__level')).toHaveText('6')
  await expect(page.getByRole('button', { name: 'Flashcards (1)' })).toBeVisible()
})

test('a plain tap opens a word', async ({ page }) => {
  await page.locator('[data-word="规划"]').tap()
  await expect(page.getByRole('dialog', { name: 'Meaning of 规划' })).toBeVisible()
})

test('a removed word is not added back on the next tap', async ({ page }) => {
  const word = page.locator('[data-word="规划"]')
  await longPress(word)
  const sheet = page.getByRole('dialog', { name: 'Meaning of 规划' })
  await sheet.getByRole('button', { name: 'Remove from flashcards' }).click()
  await expect(sheet).toContainText('Not in your flashcards.')
  await page.keyboard.press('Escape')
  await expect(word.locator('rt')).toHaveCount(0)

  await longPress(word)
  await expect(sheet.getByRole('button', { name: 'Add to flashcards' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Flashcards (0)' })).toBeVisible()
})

test('a compound missing from the dictionary is explained by its parts', async ({ page }) => {
  await longPress(page.locator('[data-word="铁路局"]'))
  const sheet = page.getByRole('dialog', { name: 'Meaning of 铁路局' })
  await expect(sheet).toContainText('Its parts')
  await expect(sheet).toContainText('railroad')
})

test('with pinyin by level, "Hide pinyin" hides it for that word', async ({ page }) => {
  await page.getByRole('button', { name: 'Show pinyin above HSK 3' }).click()
  const word = page.locator('[data-word="规划"]')
  await expect(word.locator('rt')).toHaveCount(1)
  await longPress(word)
  await page.getByRole('dialog', { name: 'Meaning of 规划' }).getByRole('button', { name: 'Hide pinyin' }).click()
  await page.keyboard.press('Escape')
  await expect(word.locator('rt')).toHaveCount(0)
})
