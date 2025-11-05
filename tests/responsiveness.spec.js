const { test, expect } = require('@playwright/test');

const desktopViewport = { width: 1280, height: 800 };
const mobileViewport = { width: 375, height: 667 };

test.describe('Visual and Responsiveness Verification', () => {

    test.beforeEach(async ({ page }) => {
        // Create a mock for the product posts API endpoint
        await page.route('**/api/products**', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: '123',
                        name: 'Smartphone Moderno',
                        price: '75000',
                        images: [{ url: 'assets/images/placeholders/product-main.png' }],
                        seller: {
                            name: 'Vendedor Teste',
                            avatar_url: 'assets/images/placeholders/avatar.png'
                        },
                        likes_count: 15,
                        comments_count: 4
                    },
                    {
                        id: '124',
                        name: 'Laptop Potente',
                        price: '250000',
                        images: [{ url: 'assets/images/placeholders/product-main.png' }],
                        seller: {
                            name: 'TecnoLoja',
                            avatar_url: 'assets/images/placeholders/avatar.png'
                        },
                        likes_count: 32,
                        comments_count: 8
                    }
                ])
            });
        });
    });

    test('Main Page Responsiveness', async ({ page }) => {
        await page.goto('http://localhost', { waitUntil: 'networkidle' });

        // Desktop screenshot
        await page.setViewportSize(desktopViewport);
        await page.screenshot({ path: 'test-results/desktop-main-page.png', fullPage: true });

        // Mobile screenshot
        await page.setViewportSize(mobileViewport);
        await page.screenshot({ path: 'test-results/mobile-main-page.png', fullPage: true });
    });

    test('Product Details Page Responsiveness', async ({ page }) => {
        // Mock the single product API endpoint
        await page.route('**/api/products/123', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: '123',
                    name: 'Smartphone Moderno',
                    price: '75000',
                    images: [
                        { url: 'assets/images/placeholders/product-main.png' },
                        { url: 'assets/images/placeholders/product-main.png' }
                    ],
                    seller: {
                        name: 'Vendedor Teste',
                        avatar_url: 'assets/images/placeholders/avatar.png'
                    },
                    description: 'Um smartphone de última geração com uma câmera incrível.'
                })
            });
        });

        await page.goto('http://localhost/product.html?id=123', { waitUntil: 'networkidle' });

        // Desktop screenshot
        await page.setViewportSize(desktopViewport);
        await page.screenshot({ path: 'test-results/desktop-product-page.png', fullPage: true });

        // Mobile screenshot
        await page.setViewportSize(mobileViewport);
        await page.screenshot({ path: 'test-results/mobile-product-page.png', fullPage: true });
    });
});
