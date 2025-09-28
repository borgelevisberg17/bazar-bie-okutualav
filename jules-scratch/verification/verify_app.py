from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local index.html file
        page.goto("file:///app/frontend/public/index.html")

        # Wait for the first product card to be visible, which indicates that
        # the API call was successful and the frontend has rendered the data.
        expect(page.locator("#products-grid .product-card").first).to_be_visible(timeout=30000)

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run_verification()