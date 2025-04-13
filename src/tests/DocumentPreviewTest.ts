import { By, until, Key } from 'selenium-webdriver';
import { AuthenticatedTest } from './base/AuthenticatedTest';
import * as path from 'path';

export class DocumentPreviewTest extends AuthenticatedTest {
    async run() {
        console.log('Testing document preview functionality...');
        
        if (!this.driver) {
            throw new Error('Driver not initialized');
        }

        // Navigate to chat page where document upload would typically be available
        await this.driver.get(`${this.baseUrl}/chat`);
        
        // Wait for chat interface to load
        await this.driver.wait(until.elementLocated(By.css('textarea[placeholder="Type your message..."]')), 5000);
        
        // Look for file upload button/icon
        try {
            const fileUploadButton = await this.driver.findElement(By.css('.upload-btn, button[aria-label="Upload file"], .file-upload'));
            await fileUploadButton.click();
            console.log('File upload button clicked');
            
            // Wait for file upload modal or interface to appear
            await this.driver.sleep(1000);
        } catch (error) {
            console.log('File upload button not found, trying alternative approach');
            
            // Try direct navigation to upload page if it exists
            try {
                await this.driver.get(`${this.baseUrl}/upload`);
                await this.driver.sleep(2000);
                console.log('Navigated to upload page');
            } catch (e) {
                console.log('Failed to find upload functionality');
                await this.takeScreenshot('upload-not-found.png');
                throw new Error('File upload functionality not found');
            }
        }
        
        // Prepare path to a test document
        const testFilePath = path.resolve(__dirname, 'test-data', 'test-document.pdf');
        
        // Find the file input element
        try {
            const fileInput = await this.driver.findElement(By.css('input[type="file"]'));
            await fileInput.sendKeys(testFilePath);
            console.log('Test document selected');
            
            // Wait for document to be processed and preview to appear
            await this.driver.wait(
                until.elementLocated(By.css('.document-preview, .preview-container')),
                10000
            );
            console.log('Document preview loaded');
            
            // Take screenshot of document preview
            await this.takeScreenshot('document-preview.png');
            
            // Test document preview controls if they exist
            try {
                // Check for next/prev page buttons
                const prevButton = await this.driver.findElement(By.css('.prev-page, .previous-btn'));
                const nextButton = await this.driver.findElement(By.css('.next-page, .next-btn'));
                
                // Test navigation
                await nextButton.click();
                await this.driver.sleep(500);
                console.log('Next page button clicked');
                
                await prevButton.click();
                await this.driver.sleep(500);
                console.log('Previous page button clicked');
                
                // Test zoom controls if they exist
                try {
                    const zoomInButton = await this.driver.findElement(By.css('.zoom-in, .increase-zoom'));
                    const zoomOutButton = await this.driver.findElement(By.css('.zoom-out, .decrease-zoom'));
                    
                    await zoomInButton.click();
                    await this.driver.sleep(500);
                    console.log('Zoom in button clicked');
                    
                    await zoomOutButton.click();
                    await this.driver.sleep(500);
                    console.log('Zoom out button clicked');
                } catch (error) {
                    console.log('Zoom controls not found, skipping zoom test');
                }
            } catch (error) {
                console.log('Document preview controls not found or document has only one page');
            }
            
            // Test document submission/confirmation
            try {
                const confirmButton = await this.driver.findElement(By.css('.confirm-upload, .submit-btn, .use-document'));
                await confirmButton.click();
                
                // Wait for confirmation or return to chat
                await this.driver.sleep(2000);
                console.log('Document confirmed/submitted');
                
                // Check if document appears in chat or context
                try {
                    await this.driver.wait(
                        until.elementLocated(By.css('.document-reference, .file-attachment, .context-document')),
                        5000
                    );
                    console.log('Document appears in chat context');
                } catch (error) {
                    console.log('Document reference in chat not found');
                }
            } catch (error) {
                console.log('Document confirmation button not found');
            }
        } catch (error) {
            console.log('File upload test failed:', error);
            await this.takeScreenshot('file-upload-failed.png');
            throw new Error('Document preview functionality not working properly');
        }
    }
} 