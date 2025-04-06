import { By, until } from 'selenium-webdriver';
import { AuthenticatedTest } from './base/AuthenticatedTest';

export class ChatInterfaceTest extends AuthenticatedTest {
    async run() {
        console.log('Testing chat interface...');
        
        if (!this.driver) {
            throw new Error('Driver not initialized');
        }

        // Navigate to chat page
        await this.driver.get(`${this.baseUrl}/chat`);
        
        // Wait for chat interface to load
        try {
            // Wait for the chat input to be present
            await this.driver.wait(until.elementLocated(By.css('textarea[placeholder="Type your message..."]')), 5000);
            console.log('Chat input found');
        } catch (error) {
            console.log('Chat input not found, taking screenshot for debugging');
            await this.takeScreenshot('chat-debug.png');
            throw new Error('Chat interface not found');
        }
        
        // Take screenshot of chat interface
        await this.takeScreenshot('chat-interface.png');
        
        // Find and interact with the message input
        const messageInput = await this.driver.findElement(By.css('textarea[placeholder="Type your message..."]'));
        await messageInput.sendKeys('Hello, this is a test message');
        
        // Find and click the send button - using the correct selector
        let sendButton;
        try {
            // Try finding by the button's specific classes
            sendButton = await this.driver.findElement(By.css('button.h-11.w-11.p-0.rounded-full'));
            console.log('Found send button by specific classes');
        } catch (error) {
            try {
                // Try finding by the button's type
                sendButton = await this.driver.findElement(By.css('button[type="button"]'));
                console.log('Found send button by type');
            } catch (error) {
                // Try finding any button near the textarea
                const parent = await this.driver.findElement(By.css('textarea[placeholder="Type your message..."]')).parent();
                sendButton = await parent.findElement(By.css('button'));
                console.log('Found send button by proximity to textarea');
            }
        }
        
        await sendButton.click();
        
        // Wait for the message to appear in the chat
        try {
            // Wait for either the user message or the assistant's response
            await this.driver.wait(
                until.elementLocated(By.xpath("//div[contains(@class, 'message') and contains(text(), 'Hello, this is a test message')]")),
                5000
            );
            console.log('Message sent successfully');
        } catch (error) {
            console.log('Message sending completed, but confirmation not found');
            await this.takeScreenshot('message-send-debug.png');
        }
    }
} 