import { By, until } from 'selenium-webdriver';
import { BaseTest } from './base/BaseTest';

export class ResourcesPageTest extends BaseTest {
    async run() {
        console.log('Testing resources page...');
        
        if (!this.driver) {
            throw new Error('Driver not initialized');
        }

        // Navigate to resources page
        await this.driver.get(`${this.baseUrl}/resources`);
        
        // Wait for resources page to load
        try {
            // Wait for resource cards to be present
            await this.driver.wait(until.elementLocated(By.css('.resource-card, .card')), 5000);
            console.log('Resource cards found');
        } catch (error) {
            console.log('Resource cards not found, taking screenshot for debugging');
            await this.takeScreenshot('resources-debug.png');
            throw new Error('Resources page elements not found');
        }
        
        // Take screenshot of resources page
        await this.takeScreenshot('resources-page.png');
        
        // Test resource card links
        try {
            // Find a resource card with a link
            const resourceLinks = await this.driver.findElements(By.css('.resource-card a, .card a'));
            
            if (resourceLinks.length === 0) {
                throw new Error('No resource links found');
            }
            
            // Verify the first link has an href attribute
            const linkHref = await resourceLinks[0].getAttribute('href');
            
            if (!linkHref) {
                throw new Error('Resource link has no href attribute');
            }
            
            console.log('Resource links verified');
        } catch (error) {
            console.log('Resource link test failed:', error);
            await this.takeScreenshot('resource-links-failed.png');
        }
        
        // Test resource categories/filters if they exist
        try {
            const categoryButtons = await this.driver.findElements(By.css('.category-filter, .filter-button'));
            
            if (categoryButtons.length > 0) {
                // Click the first category button
                await categoryButtons[0].click();
                
                // Wait for the page to update with filtered results
                await this.driver.sleep(1000);
                
                // Take screenshot of filtered resources
                await this.takeScreenshot('filtered-resources.png');
                console.log('Resource filtering tested');
            } else {
                console.log('No category filters found, skipping filter test');
            }
        } catch (error) {
            console.log('Resource category filter test failed');
            await this.takeScreenshot('category-filter-failed.png');
        }
    }
} 