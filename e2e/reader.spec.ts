import { expect, test } from '@playwright/test'

test('pinyin is hidden until asked for, then shows only above the chosen level', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Paste a Chinese article').fill('我去银行。国家铁路局发布了规划。')
  await page.getByRole('button', { name: 'Read' }).click()

  const reader = page.locator('.reader')
  await expect(reader).toBeVisible()
  await expect(reader.locator('rt')).toHaveCount(0)
  await page.getByRole('button', { name: 'Show pinyin above HSK 3' }).click()
  // 银行 is HSK 3: no pinyin at level 3, pinyin at level 2.
  await expect(reader.locator('[data-word="银行"] rt')).toHaveCount(0)
  await page.getByRole('radio', { name: '2' }).click()
  await expect(reader.locator('[data-word="银行"] rt')).toHaveText('yín háng')
  // 铁路局 is not on the HSK list, so it always gets pinyin.
  await expect(reader.locator('[data-word="铁路局"] rt')).toHaveText('tiě lù jú')
})
