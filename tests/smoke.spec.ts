import { expect, test } from '@playwright/test'

test('landing page renders and signup CTA points to signup', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Publish a profile that feels gallery-ready.' })).toBeVisible()

  const claimCta = page.getByRole('link', { name: 'Claim your profile' })
  await expect(claimCta).toBeVisible()
  await expect(claimCta).toHaveAttribute('href', '/signup')
})
