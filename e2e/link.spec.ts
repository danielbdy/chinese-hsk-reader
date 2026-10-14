import { expect, test } from '@playwright/test'

test('a news link is fetched, read, and its cards can be previewed', async ({ page }) => {
  // The API function runs on Vercel, so the test answers the request itself.
  await page.route('**/api/fetch-article**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        url: 'https://news.example.cn/a/123.html',
        title: '铁路出行新变化',
        paragraphs: ['旅客可以在手机上查询车次、预订车票和办理改签，12306平台将升级为全行程智能服务。'],
      }),
    }),
  )

  await page.goto('/')
  await page.getByRole('tab', { name: 'From a link' }).click()
  await page.getByLabel('Link to a Chinese news page').fill('https://news.example.cn/a/123.html')
  await page.getByRole('button', { name: 'Fetch and read' }).click()

  await expect(page.locator('.reader')).toContainText('12306')

  // Save 升级 from the article, then preview its card.
  const word = page.locator('[data-word="升级"]')
  const box = await word.boundingBox()
  const point = { pointerType: 'touch', isPrimary: true, clientX: box!.x + 4, clientY: box!.y + box!.height - 8 }
  await word.dispatchEvent('pointerdown', point)
  await page.waitForTimeout(600)
  await word.dispatchEvent('pointerup', point)
  await expect(page.getByText('Added to your flashcards ✓')).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Flashcards (1)' }).click()
  await page.getByRole('button', { name: 'Preview' }).click()
  const preview = page.locator('.card-preview')
  await expect(preview).toContainText('Front')
  await expect(preview.locator('b').first()).toHaveText('升级')
  await expect(preview).toContainText('Back')
  await expect(preview).toContainText('铁路出行新变化')
})

test('a link that cannot be read shows the reason and keeps the form', async ({ page }) => {
  await page.route('**/api/fetch-article**', (route) =>
    route.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'No Chinese article text found on that page. Paste the text instead.' }),
    }),
  )
  await page.goto('/')
  await page.getByRole('tab', { name: 'From a link' }).click()
  await page.getByLabel('Link to a Chinese news page').fill('https://news.example.cn/empty')
  await page.getByRole('button', { name: 'Fetch and read' }).click()
  await expect(page.getByRole('alert')).toContainText('Paste the text instead')
  await expect(page.getByLabel('Link to a Chinese news page')).toHaveValue('https://news.example.cn/empty')
})
