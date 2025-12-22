import asyncio
from playwright.async_api import async_playwright
import sys
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # Set a wider viewport to capture all columns
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})

        # Define the base URL, falling back to localhost if not set
        base_url = os.environ.get("BASE_URL", "http://localhost:3000")
        app_path = "/test-salardon-sheril-interface"
        target_url = f"{base_url}{app_path}"

        # Load XML data from files
        try:
            with open('public/examples/rapport.xml', 'r', encoding='utf-8') as file:
                rapport_xml = file.read()
            with open('public/examples/data.xml', 'r', encoding='utf-8') as file:
                data_xml = file.read()
        except FileNotFoundError as e:
            print(f"Error loading XML data: {e}", file=sys.stderr)
            await browser.close()
            sys.exit(1)

        # Navigate to the page and set up local storage
        try:
            await page.goto(target_url)
        except Exception as e:
            print(f"Failed to navigate to {target_url}: {e}", file=sys.stderr)
            await browser.close()
            sys.exit(1)


        # Use page.evaluate to pass variables securely and avoid syntax issues
        await page.evaluate('''
            ([rapport, data]) => {
                localStorage.setItem('rapportXml', rapport);
                localStorage.setItem('dataXml', data);
            }
        ''', [rapport_xml, data_xml])

        # Reload the page to apply the data
        await page.reload()

        # Navigate to the Flottes screen
        try:
            await page.click('text=Flottes')
        except Exception as e:
            print(f"Could not find or click the 'Flottes' link: {e}", file=sys.stderr)
            await page.screenshot(path="/home/jules/verification/error_screenshot.png")
            await browser.close()
            sys.exit(1)

        # Wait for the table to be visible
        try:
            await page.wait_for_selector('table', timeout=10000) # Increased timeout
        except Exception as e:
            print(f"Timed out waiting for table to become visible: {e}", file=sys.stderr)
            await page.screenshot(path="/home/jules/verification/error_screenshot.png")
            await browser.close()
            sys.exit(1)


        # Take a screenshot
        screenshot_path = "/home/jules/verification/verification.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
