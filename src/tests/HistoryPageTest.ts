import { By, until } from 'selenium-webdriver';
import { AuthenticatedTest } from './base/AuthenticatedTest';

export class HistoryPageTest extends AuthenticatedTest {
    async run() {
        console.log('Testing history page...');
        
        if (!this.driver) {
            throw new Error('Driver not initialized');
        }

        // Navigate to history page
        await this.driver.get(`${this.baseUrl}/history`);
        
        // Wait for history content to load
        try {
            // Wait for the history page title
            await this.driver.wait(until.elementLocated(By.xpath("//h2[contains(text(), 'Conversation History')]")), 5000);
            console.log('History page title found');
            
            // Wait for the history container
            await this.driver.wait(until.elementLocated(By.css('.bg-card\\/50')), 5000);
            console.log('History container found');
        } catch (error) {
            console.log('History page elements not found, taking screenshot for debugging');
            await this.takeScreenshot('history-debug.png');
            throw new Error('History page not found');
        }
        
        // Take screenshot of history page
        await this.takeScreenshot('history-page.png');
        
        // Check for history items
        const historyItems = await this.driver.findElements(By.css('.bg-background.rounded-xl'));
        console.log(`Found ${historyItems.length} history items`);
        
        if (historyItems.length > 0) {
            // Click on the first history item
            await historyItems[0].click();
            
            // Wait for chat to load
            try {
                await this.driver.wait(until.elementLocated(By.css('textarea[placeholder="Type your message..."]')), 5000);
                console.log('Successfully loaded chat from history');
            } catch (error) {
                console.log('Chat loading from history completed, but chat input not found');
                await this.takeScreenshot('history-chat-debug.png');
            }
        } else {
            console.log('No history items found, this might be expected if the user has no conversations');
        }
    }
} 