import { By, until } from 'selenium-webdriver';
import { BaseTest } from './base/BaseTest';

export class PublicPagesTest extends BaseTest {
    async run() {
        console.log('Testing public pages navigation...');
        
        if (!this.driver) {
            throw new Error('Driver not initialized');
        }

        // Test Home page
        await this.driver.get(this.baseUrl);
        const homeTitle = await this.driver.getTitle();
        console.log('Home page title:', homeTitle);

        // Test About page
        await this.driver.findElement(By.css("a[href='/about']")).click();
        await this.driver.wait(until.urlContains('/about'), 5000);
        console.log('Successfully navigated to About page');

        // Test Resources page
        await this.driver.findElement(By.css("a[href='/resources']")).click();
        await this.driver.wait(until.urlContains('/resources'), 5000);
        console.log('Successfully navigated to Resources page');
    }
} 