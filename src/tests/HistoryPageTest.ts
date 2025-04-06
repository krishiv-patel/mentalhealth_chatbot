import { By, until } from 'selenium-webdriver';
import { BaseTest } from './base/BaseTest';

export class HistoryPageTest extends BaseTest {
    async run() {
        console.log('Testing history page...');
        
        if (!this.driver) {
            throw new Error('Driver not initialized');
        }

        // Navigate to history page
        await this.driver.get(`${this.baseUrl}/history`);
        
        // Wait for history content to load - try different selectors
        try {
            await this.driver.wait(until.elementLocated(By.css('.history-content')), 5000);
        } catch (error) {
            console.log('History content not found with primary selector, trying alternatives...');
            
            // Try to find any history-related element
            const historyElements = await this.driver.findElements(By.css('.history, [data-testid="history"], table, .list'));
            if (historyElements.length === 0) {
                console.log('No history elements found, taking screenshot for debugging');
                await this.takeScreenshot('history-debug.png');
                throw new Error('History page content not found');
            }
        }
        
        // Take screenshot of history page
        await this.takeScreenshot('history-page.png');
        
        console.log('History page loaded successfully');
    }
} 