import { By, until } from 'selenium-webdriver';
import { AuthenticatedTest } from './base/AuthenticatedTest';

export class ModelsPageTest extends AuthenticatedTest {
    async run() {
        console.log('Testing models page...');
        
        if (!this.driver) {
            throw new Error('Driver not initialized');
        }

        // Navigate to models page
        await this.driver.get(`${this.baseUrl}/models`);
        
        // Wait for models page to load
        try {
            // Wait for model cards to be present
            await this.driver.wait(until.elementLocated(By.css('.model-card')), 5000);
            console.log('Model cards found');
        } catch (error) {
            console.log('Model cards not found, taking screenshot for debugging');
            await this.takeScreenshot('models-debug.png');
            throw new Error('Models page elements not found');
        }
        
        // Take screenshot of models page
        await this.takeScreenshot('models-page.png');
        
        // Verify model selection works
        try {
            // Find and click on a model card
            const modelCard = await this.driver.findElement(By.css('.model-card'));
            await modelCard.click();
            
            // Check if the model gets selected (usually indicated by a highlight or active state)
            await this.driver.wait(
                until.elementLocated(By.css('.model-card.active, .model-card.selected')), 
                3000
            );
            console.log('Model selection successful');
        } catch (error) {
            console.log('Model selection test failed');
            await this.takeScreenshot('model-selection-failed.png');
            throw new Error('Model selection not working properly');
        }
        
        // Test model information display
        try {
            // Check if model information displays when a model is selected
            await this.driver.wait(
                until.elementLocated(By.css('.model-info')), 
                3000
            );
            console.log('Model information displayed correctly');
        } catch (error) {
            console.log('Model information display test failed');
            await this.takeScreenshot('model-info-failed.png');
        }
    }
} 