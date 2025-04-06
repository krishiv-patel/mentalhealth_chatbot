import { By, until } from 'selenium-webdriver';
import { BaseTest } from './base/BaseTest';

export class AuthenticationTest extends BaseTest {
    async run() {
        console.log('Testing authentication...');
        
        if (!this.driver) {
            throw new Error('Driver not initialized');
        }

        // Navigate to login page
        await this.driver.get(`${this.baseUrl}/login`);
        
        // Test login form
        const emailInput = await this.driver.findElement(By.css('input[type="email"]'));
        const passwordInput = await this.driver.findElement(By.css('input[type="password"]'));
        
        await emailInput.sendKeys('test@example.com');
        await passwordInput.sendKeys('testpassword');
        
        // Take screenshot before login attempt
        await this.takeScreenshot('before-login.png');
        
        // Submit login form
        await this.driver.findElement(By.css('form')).submit();
        
        // Wait for either success or error message
        try {
            await this.driver.wait(until.elementLocated(By.css('.toast')), 5000);
            console.log('Login attempt completed');
        } catch {
            console.log('Login form submission completed');
        }
    }
} 