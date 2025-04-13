import { By, until, Key } from 'selenium-webdriver';
import { AuthenticatedTest } from './base/AuthenticatedTest';

export class ProfileTest extends AuthenticatedTest {
    async run() {
        console.log('Testing profile functionality...');
        
        if (!this.driver) {
            throw new Error('Driver not initialized');
        }

        // Navigate to a page with the profile feature
        await this.driver.get(`${this.baseUrl}/chat`);
        
        // Wait for page to load
        await this.driver.sleep(2000);
        
        // Find and click the profile button/icon
        try {
            // Look for profile button in the header or navigation
            const profileButton = await this.driver.findElement(By.css('button.profile-btn, .avatar, .user-menu'));
            await profileButton.click();
            console.log('Profile button clicked');
            
            // Wait for profile modal to appear
            await this.driver.wait(
                until.elementLocated(By.css('.profile-modal, .modal, dialog')),
                5000
            );
            console.log('Profile modal opened');
        } catch (error) {
            console.log('Could not open profile modal:', error);
            await this.takeScreenshot('profile-open-failed.png');
            throw new Error('Failed to open profile modal');
        }
        
        // Take screenshot of profile modal
        await this.takeScreenshot('profile-modal.png');
        
        // Test updating profile information
        try {
            // Find and interact with profile name field
            const nameField = await this.driver.findElement(By.css('input[name="name"], input.name-field'));
            
            // Clear the field and type a new name
            await nameField.clear();
            const testName = `Test User ${Date.now().toString().slice(-4)}`;
            await nameField.sendKeys(testName);
            
            // Find and click save/update button
            const saveButton = await this.driver.findElement(By.css('button.save-btn, button[type="submit"]'));
            await saveButton.click();
            
            // Wait for update confirmation (toast message or success alert)
            try {
                await this.driver.wait(
                    until.elementLocated(By.css('.toast, .alert-success, .notification')),
                    5000
                );
                console.log('Profile update confirmation received');
            } catch (error) {
                console.log('No update confirmation found, but proceeding with test');
            }
            
            // Close the modal if it's still open
            try {
                const closeButton = await this.driver.findElement(By.css('.close-modal, .modal-close, button.close'));
                await closeButton.click();
                await this.driver.sleep(1000);
                console.log('Modal closed');
            } catch (error) {
                console.log('Modal already closed or close button not found');
                // Try pressing ESC key to close the modal
                await this.driver.actions().sendKeys(Key.ESCAPE).perform();
            }
            
            // Verify profile update by reopening profile
            await this.driver.findElement(By.css('button.profile-btn, .avatar, .user-menu')).click();
            await this.driver.wait(
                until.elementLocated(By.css('.profile-modal, .modal, dialog')),
                5000
            );
            
            // Check if name field contains updated value
            const updatedNameField = await this.driver.findElement(By.css('input[name="name"], input.name-field'));
            const nameValue = await updatedNameField.getAttribute('value');
            
            if (nameValue === testName) {
                console.log('Profile name update verified');
            } else {
                console.log(`Profile update verification failed. Expected: ${testName}, Got: ${nameValue}`);
                throw new Error('Profile update not persisted');
            }
            
            // Close modal again
            try {
                const closeButton = await this.driver.findElement(By.css('.close-modal, .modal-close, button.close'));
                await closeButton.click();
            } catch (error) {
                // Try pressing ESC key to close the modal
                await this.driver.actions().sendKeys(Key.ESCAPE).perform();
            }
        } catch (error) {
            console.log('Profile update test failed:', error);
            await this.takeScreenshot('profile-update-failed.png');
            throw new Error('Profile update functionality not working properly');
        }
    }
} 