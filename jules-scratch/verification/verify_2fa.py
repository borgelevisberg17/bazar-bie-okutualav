from playwright.sync_api import sync_playwright
import os

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # Construct the file path to the security.html file
    file_path = os.path.abspath('frontend/public/security.html')

    page.goto(f'file://{file_path}')
    page.screenshot(path='jules-scratch/verification/verification.png')
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
