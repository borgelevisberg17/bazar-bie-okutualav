const { test, expect } = require('@playwright/test');

test.describe('Visual Regression Test for Main and How It Works Pages', () => {
  test('should display the main page correctly', async ({ page }) => {
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    await expect(page.locator('#social-feed')).toBeVisible();
    await page.screenshot({ path: '/home/swebot/jules-scratch/verification/main-page-fixed.png', fullPage: true });
  });

  test('should display the "How It Works" page correctly with interactive FAQs', async ({ page }) => {
    await page.goto('http://localhost:8080/how-it-works.html', { waitUntil: 'networkidle' });

    // Check if the main content is visible
    await expect(page.locator('.how-it-works-content')).toBeVisible();

    // Take a screenshot before interacting with the FAQ
    await page.screenshot({ path: '/home/swebot/jules-scratch/verification/how-it-works-page-fixed-before-faq.png', fullPage: true });

    // Test the FAQ interaction
    const firstFaq = page.locator('.faq-item').first();
    const firstFaqAnswer = firstFaq.locator('.faq-answer');

    await expect(firstFaqAnswer).toBeHidden();
    await firstFaq.locator('.faq-question').click();
    await expect(firstFaqAnswer).toBeVisible();

    // Take a screenshot after interacting with the FAQ
    await page.screenshot({ path: '/home/swebot/jules-scratch/verification/how-it-works-page-fixed-after-faq.png', fullPage: true });
  });
});
