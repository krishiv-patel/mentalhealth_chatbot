import { WebDriver, By, until, Key } from 'selenium-webdriver';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Utility functions for testing the mental health chatbot application
 */
export class TestUtils {
    /**
     * Wait for an element to be both present and visible on the page
     */
    static async waitForElement(driver: WebDriver, selector: string, timeoutMs: number = 5000): Promise<boolean> {
        try {
            const element = await driver.wait(until.elementLocated(By.css(selector)), timeoutMs);
            await driver.wait(until.elementIsVisible(element), timeoutMs);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Safely click an element with retries
     */
    static async safeClick(driver: WebDriver, selector: string, maxRetries: number = 3): Promise<boolean> {
        let retries = 0;
        while (retries < maxRetries) {
            try {
                const element = await driver.findElement(By.css(selector));
                await driver.wait(until.elementIsVisible(element), 2000);
                await element.click();
                return true;
            } catch (error) {
                retries++;
                if (retries >= maxRetries) {
                    console.log(`Failed to click element with selector: ${selector} after ${maxRetries} attempts`);
                    return false;
                }
                // Wait before retrying
                await driver.sleep(500);
            }
        }
        return false;
    }

    /**
     * Safely type text into an input field
     */
    static async typeText(driver: WebDriver, selector: string, text: string): Promise<boolean> {
        try {
            const element = await driver.findElement(By.css(selector));
            await element.clear();
            await element.sendKeys(text);
            return true;
        } catch (error) {
            console.log(`Failed to type text into element with selector: ${selector}`);
            return false;
        }
    }

    /**
     * Check if an element contains specific text
     */
    static async elementContainsText(driver: WebDriver, selector: string, text: string): Promise<boolean> {
        try {
            const element = await driver.findElement(By.css(selector));
            const elementText = await element.getText();
            return elementText.includes(text);
        } catch (error) {
            return false;
        }
    }

    /**
     * Wait for a page to load completely
     */
    static async waitForPageLoad(driver: WebDriver, timeoutMs: number = 10000): Promise<void> {
        await driver.wait(() => {
            return driver.executeScript('return document.readyState').then((readyState) => {
                return readyState === 'complete';
            });
        }, timeoutMs);
    }

    /**
     * Scroll element into view
     */
    static async scrollIntoView(driver: WebDriver, selector: string): Promise<boolean> {
        try {
            const element = await driver.findElement(By.css(selector));
            await driver.executeScript('arguments[0].scrollIntoView({ behavior: "smooth", block: "center" });', element);
            // Wait a moment for the scroll to complete
            await driver.sleep(500);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get the current URL path
     */
    static async getCurrentPath(driver: WebDriver): Promise<string> {
        const url = await driver.getCurrentUrl();
        return new URL(url).pathname;
    }

    /**
     * Generate a timestamp string for naming files
     */
    static getTimestampString(): string {
        return new Date().toISOString().replace(/:/g, '-').replace(/\./g, '_');
    }

    /**
     * Save logs to a file
     */
    static saveLogs(filename: string, logs: string[]): void {
        const logsDir = path.resolve(__dirname, '..', 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        const logContent = logs.join('\n');
        fs.writeFileSync(path.join(logsDir, filename), logContent);
    }

    /**
     * Get browser console logs if available
     */
    static async getBrowserLogs(driver: WebDriver): Promise<string[]> {
        try {
            const logs = await driver.manage().logs().get('browser');
            return logs.map(log => `[${log.level.name}] ${log.message}`);
        } catch (error) {
            return [`Error retrieving browser logs: ${error}`];
        }
    }
} 