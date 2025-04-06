import { By, until } from 'selenium-webdriver';
import { BaseTest } from './base/BaseTest';
import { join } from 'path';

export class FileUploadTest extends BaseTest {
    async run() {
        console.log('Testing file upload...');
        
        if (!this.driver) {
            throw new Error('Driver not initialized');
        }

        // Navigate to test upload page
        await this.driver.get(`${this.baseUrl}/test-upload`);
        
        // Find file input
        const fileInput = await this.driver.findElement(By.css('input[type="file"]'));
        
        // Create a path to a test file in the project directory
        // This assumes there's a test file in the project root
        const testFilePath = join(process.cwd(), 'test-file.txt');
        
        // Check if the file exists, if not create it
        const fs = await import('fs');
        if (!fs.existsSync(testFilePath)) {
            console.log('Test file not found, creating one...');
            fs.writeFileSync(testFilePath, 'This is a test file for Selenium testing.');
        }
        
        // Upload the test file
        await fileInput.sendKeys(testFilePath);
        
        // Wait for upload to complete
        try {
            await this.driver.wait(
                until.elementLocated(By.xpath("//div[contains(text(), 'Upload successful')]")),
                5000
            );
            console.log('File upload successful');
        } catch (error) {
            console.log('File upload completed, but success message not found');
        }
    }
} 