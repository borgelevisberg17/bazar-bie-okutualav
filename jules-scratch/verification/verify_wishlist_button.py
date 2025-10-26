from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://127.0.0.1:8080/index.html")

    # Wait for the products to be rendered
    page.wait_for_selector(".product-card")

    # Find the first wishlist button and check if it's visible
    wishlist_button = page.locator(".btn-wishlist").first
    assert wishlist_button.is_visible()

    page.screenshot(path="jules-scratch/verification/verification.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
