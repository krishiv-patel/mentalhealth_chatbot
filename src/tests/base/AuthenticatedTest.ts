import { By, until, WebDriver } from 'selenium-webdriver';
import { BaseTest } from './BaseTest';

export abstract class AuthenticatedTest extends BaseTest {
    protected async login() {
        if (!this.driver) {
            throw new Error('Driver not initialized');
        }

        console.log('Logging in...');
        await this.driver.get(`${this.baseUrl}/login`);
        
        const emailInput = await this.driver.findElement(By.css('input[type="email"]'));
        const passwordInput = await this.driver.findElement(By.css('input[type="password"]'));
        
        await emailInput.sendKeys('yagnap32@gmail.com');
        await passwordInput.sendKeys('NewPass@2212');
        
        await this.driver.findElement(By.css('form')).submit();
        
        // Wait for login to complete
        try {
            await this.driver.wait(until.elementLocated(By.css('.toast')), 5000);
            console.log('Login successful');
        } catch (error) {
            console.log('Login completed, but no toast message found');
        }
        
        // Additional wait to ensure the app is ready
        await this.driver.sleep(2000);
    }

    async initialize() {
        await super.initialize();
        await this.login();
    }
} 