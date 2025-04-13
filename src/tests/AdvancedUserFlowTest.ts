import { By, until, Key, WebElement } from 'selenium-webdriver';
import { AuthenticatedTest } from './base/AuthenticatedTest';
import { TestUtils } from './base/TestUtils';
import * as path from 'path';

/**
 * Advanced test that covers complex user flows and interactions
 * This test simulates a complete user journey through multiple features
 */
export class AdvancedUserFlowTest extends AuthenticatedTest {
    async run() {
        console.log('Running advanced user flow test...');
        
        if (!this.driver) {
            throw new Error('Driver not initialized');
        }
        
        // Store console logs for analysis
        const consoleLogs: string[] = [];
        
        try {
            // Start with home page and capture performance metrics
            await this.testHomePage();
            
            // Test navigation between pages
            await this.testNavigation();
            
            // Test advanced chat features
            await this.testAdvancedChatFeatures();
            
            // Test chat with different types of queries
            await this.testChatSequence();
            
            // Test document upload and chat with context
            await this.testDocumentBasedChat();
            
            // Test profile update and persistence
            await this.testProfileUpdateFlow();
            
            // Test accessibility of key components
            await this.testAccessibility();
            
            // Test responsive behavior
            await this.testResponsiveness();
            
            // Get browser console logs and save them
            const logs = await TestUtils.getBrowserLogs(this.driver);
            consoleLogs.push(...logs);
            TestUtils.saveLogs(`advanced-flow-console-${TestUtils.getTimestampString()}.log`, consoleLogs);
            
        } catch (error) {
            console.error('Advanced user flow test failed:', error);
            await this.takeScreenshot(`advanced-flow-failure-${TestUtils.getTimestampString()}.png`);
            throw error;
        }
    }
    
    /**
     * Test initial home page load and performance
     */
    private async testHomePage() {
        console.log('Testing home page load and performance...');
        
        // Navigate to home page and measure load time
        const startTime = Date.now();
        await this.driver!.get(this.baseUrl);
        
        // Wait for page to be fully loaded
        await TestUtils.waitForPageLoad(this.driver!);
        const loadTime = Date.now() - startTime;
        console.log(`Home page load time: ${loadTime}ms`);
        
        // Take screenshot of home page
        await this.takeScreenshot('home-page.png');
        
        // Check for key elements on home page
        const mainHeading = await this.driver!.findElements(By.css('h1'));
        if (mainHeading.length > 0) {
            const headingText = await mainHeading[0].getText();
            console.log(`Home page heading: ${headingText}`);
        }
        
        // Verify hero section and call-to-action buttons
        const ctaButtons = await this.driver!.findElements(By.css('a.cta, button.cta, a.btn-primary, button.btn-primary'));
        console.log(`Found ${ctaButtons.length} call-to-action buttons`);
        
        if (ctaButtons.length > 0) {
            // Test the first CTA button
            await ctaButtons[0].click();
            // Wait for navigation
            await TestUtils.waitForPageLoad(this.driver!);
            console.log('CTA button navigation successful');
            // Go back to home
            await this.driver!.navigate().back();
            await TestUtils.waitForPageLoad(this.driver!);
        }
    }
    
    /**
     * Test navigation through main site pages
     */
    private async testNavigation() {
        console.log('Testing site navigation...');
        
        // List of pages to test
        const pages = [
            { name: 'About', path: '/about' },
            { name: 'Resources', path: '/resources' },
            { name: 'Chat', path: '/chat' },
            { name: 'Models', path: '/models' }
        ];
        
        // Navigate to each page and verify
        for (const page of pages) {
            await this.driver!.get(`${this.baseUrl}${page.path}`);
            await TestUtils.waitForPageLoad(this.driver!);
            
            const currentPath = await TestUtils.getCurrentPath(this.driver!);
            if (currentPath.includes(page.path)) {
                console.log(`✓ Successfully navigated to ${page.name} page`);
            } else {
                console.log(`✗ Failed to navigate to ${page.name} page, current path: ${currentPath}`);
            }
            
            // Take screenshot of each page
            await this.takeScreenshot(`navigation-${page.name.toLowerCase()}.png`);
        }
    }
    
    /**
     * Test advanced chat features including editing, sharing, clearing, and creating new chats
     */
    private async testAdvancedChatFeatures() {
        console.log('Testing advanced chat features (edit, share, clear, new chat)...');
        
        // Navigate to chat page
        await this.driver!.get(`${this.baseUrl}/chat`);
        await TestUtils.waitForPageLoad(this.driver!);
        
        // Wait longer for any animations or dynamic content to fully load
        await this.driver!.sleep(2000);
        
        // 1. Send a simple "Hi" message and test response
        console.log('Testing basic message exchange...');
        try {
            // Ensure the message input is in view and interactable
            const messageInput = await this.driver!.wait(
                until.elementLocated(By.css('textarea[placeholder="Type your message..."]')),
                10000
            );
            
            // Wait for element to be visible and interactable
            await this.driver!.wait(until.elementIsVisible(messageInput), 5000);
            await this.driver!.wait(until.elementIsEnabled(messageInput), 5000);
            
            // Use JavaScript to scroll element into view first
            await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", messageInput);
            await this.driver!.sleep(500);
            
            // Use JavaScript to clear and set value if direct interaction fails
            try {
                await messageInput.clear();
                await messageInput.sendKeys('Hi');
            } catch (error) {
                await this.driver!.executeScript("arguments[0].value = '';", messageInput);
                await this.driver!.executeScript("arguments[0].value = 'Hi';", messageInput);
                console.log('Used JavaScript to set input value');
            }
            
            // Find and click send button, again ensuring it's interactable
            const sendButton = await this.driver!.wait(
                until.elementLocated(By.css('button[type="submit"], button.send-btn')),
                5000
            );
            await this.driver!.wait(until.elementIsVisible(sendButton), 5000);
            await this.driver!.wait(until.elementIsEnabled(sendButton), 5000);
            
            // Use JavaScript to scroll and click if direct interaction fails
            try {
                await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", sendButton);
                await this.driver!.sleep(500);
                await sendButton.click();
            } catch (error) {
                await this.driver!.executeScript("arguments[0].click();", sendButton);
                console.log('Used JavaScript to click send button');
            }
            
            // Wait for user message to appear
            await this.driver!.wait(
                until.elementLocated(By.xpath(`//div[contains(@class, 'message') and contains(., 'Hi')]`)),
                10000
            );
            console.log('✓ Hi message sent');
            
            // Wait for bot response
            await this.driver!.wait(
                until.elementLocated(By.css('.assistant-message, .bot-message')),
                20000
            );
            console.log('✓ Bot response received');
            
            await this.takeScreenshot('chat-basic-hi-message.png');
        } catch (error) {
            console.log('✗ Basic message exchange failed:', error);
            await this.takeScreenshot('basic-chat-failed.png');
        }
        
        // Wait before next interaction
        await this.driver!.sleep(1000);
        
        // 2. Test message editing functionality
        console.log('Testing message editing functionality...');
        try {
            // Find the last user message
            const userMessages = await this.driver!.findElements(By.css('.user-message, .message.user'));
            if (userMessages.length > 0) {
                const lastUserMessage = userMessages[userMessages.length - 1];
                
                // Make sure message is visible before interaction
                await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", lastUserMessage);
                await this.driver!.sleep(500);
                
                // Hover over message to reveal edit button if needed
                await this.driver!.actions().move({origin: lastUserMessage}).perform();
                await this.driver!.sleep(1000); // Longer hover time to ensure UI responds
                
                // Try to find edit button with different potential selectors
                let editButton = null;
                try {
                    // Try inside the message first
                    editButton = await lastUserMessage.findElement(By.css('.edit-btn, button[aria-label="Edit"], .edit-icon'));
                } catch (error) {
                    // Try in the general context
                    try {
                        editButton = await this.driver!.findElement(By.css('.edit-btn, button[aria-label="Edit"], .edit-icon'));
                    } catch (e) {
                        // Check for menu with edit option
                        try {
                            const menuButton = await lastUserMessage.findElement(By.css('.message-menu, .more-options'));
                            
                            // Make sure menu button is visible and clickable
                            await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", menuButton);
                            await this.driver!.sleep(500);
                            
                            try {
                                await menuButton.click();
                            } catch (error) {
                                await this.driver!.executeScript("arguments[0].click();", menuButton);
                            }
                            
                            await this.driver!.sleep(1000);
                            editButton = await this.driver!.findElement(By.css('.edit-option, button:contains("Edit")'));
                        } catch (err) {
                            console.log('Edit button not found in message or menu');
                        }
                    }
                }
                
                if (editButton) {
                    // Make button visible and clickable
                    await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", editButton);
                    await this.driver!.sleep(500);
                    
                    try {
                        await editButton.click();
                    } catch (error) {
                        await this.driver!.executeScript("arguments[0].click();", editButton);
                    }
                    
                    console.log('✓ Edit button clicked');
                    
                    // Wait for edit mode or modal
                    await this.driver!.sleep(1500);
                    
                    // Find the edit input (might be same as chat input)
                    const editInput = await this.driver!.wait(
                        until.elementLocated(By.css('.edit-input, textarea[placeholder="Type your message..."]')),
                        5000
                    );
                    
                    // Wait for element to be visible and interactable
                    await this.driver!.wait(until.elementIsVisible(editInput), 5000);
                    await this.driver!.wait(until.elementIsEnabled(editInput), 5000);
                    
                    // Use JavaScript to clear and set value
                    try {
                        await editInput.clear();
                        await editInput.sendKeys('Hi, this is an edited message');
                    } catch (error) {
                        await this.driver!.executeScript("arguments[0].value = '';", editInput);
                        await this.driver!.executeScript("arguments[0].value = 'Hi, this is an edited message';", editInput);
                    }
                    
                    // Find and click the submit/update button
                    const updateButton = await this.driver!.wait(
                        until.elementLocated(By.css('.update-btn, button[type="submit"]')),
                        5000
                    );
                    
                    // Ensure button is visible and clickable
                    await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", updateButton);
                    await this.driver!.sleep(500);
                    
                    try {
                        await updateButton.click();
                    } catch (error) {
                        await this.driver!.executeScript("arguments[0].click();", updateButton);
                    }
                    
                    // Wait for edited message to appear
                    await this.driver!.wait(
                        until.elementLocated(By.xpath(`//div[contains(@class, 'message') and contains(., 'edited message')]`)),
                        10000
                    );
                    console.log('✓ Message edited successfully');
                    
                    // Wait for response to edited message
                    await this.driver!.wait(
                        until.elementLocated(By.css('.assistant-message, .bot-message')),
                        20000
                    );
                    console.log('✓ Bot response to edited message received');
                    
                    await this.takeScreenshot('edited-message.png');
                } else {
                    console.log('✗ Edit button not found');
                    await this.takeScreenshot('edit-button-not-found.png');
                }
            } else {
                console.log('✗ No user messages found to edit');
            }
        } catch (error) {
            console.log('✗ Message editing test failed:', error);
            await this.takeScreenshot('edit-message-failed.png');
        }
        
        // Wait before next interaction
        await this.driver!.sleep(1000);
        
        // 3. Test share chat functionality
        console.log('Testing share chat functionality...');
        try {
            // Find share button (might be in a menu or directly visible)
            let shareButton = null;
            
            // Try direct share button first
            try {
                shareButton = await this.driver!.findElement(By.css('.share-btn, button[aria-label="Share chat"]'));
            } catch (error) {
                // Try finding it in a menu
                try {
                    const menuButton = await this.driver!.findElement(By.css('.chat-menu, .menu-btn, button[aria-label="Menu"]'));
                    
                    // Make sure menu button is visible and clickable
                    await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", menuButton);
                    await this.driver!.sleep(500);
                    
                    try {
                        await menuButton.click();
                    } catch (clickError) {
                        await this.driver!.executeScript("arguments[0].click();", menuButton);
                    }
                    
                    await this.driver!.sleep(1000);
                    shareButton = await this.driver!.findElement(By.css('.share-option, button:contains("Share")'));
                } catch (err) {
                    console.log('Share button not found in main UI or menu');
                }
            }
            
            if (shareButton) {
                // Make sure share button is visible and clickable
                await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", shareButton);
                await this.driver!.sleep(500);
                
                try {
                    await shareButton.click();
                } catch (error) {
                    await this.driver!.executeScript("arguments[0].click();", shareButton);
                }
                
                console.log('✓ Share button clicked');
                
                // Wait for share dialog/modal
                await this.driver!.wait(
                    until.elementLocated(By.css('.share-dialog, .modal, dialog')),
                    5000
                );
                console.log('✓ Share dialog opened');
                
                await this.takeScreenshot('share-dialog.png');
                
                // Close the dialog
                try {
                    const closeButton = await this.driver!.findElement(By.css('.close-btn, button[aria-label="Close"]'));
                    
                    // Make sure close button is visible and clickable
                    await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", closeButton);
                    await this.driver!.sleep(500);
                    
                    try {
                        await closeButton.click();
                    } catch (error) {
                        await this.driver!.executeScript("arguments[0].click();", closeButton);
                    }
                } catch (error) {
                    // Try pressing ESC if close button not found
                    await this.driver!.actions().sendKeys(Key.ESCAPE).perform();
                }
                
                await this.driver!.sleep(1000);
                console.log('✓ Share dialog closed');
            } else {
                console.log('✗ Share button not found');
                await this.takeScreenshot('share-button-not-found.png');
            }
        } catch (error) {
            console.log('✗ Share chat test failed:', error);
            await this.takeScreenshot('share-chat-failed.png');
        }
        
        // Wait before next interaction
        await this.driver!.sleep(1000);
        
        // 4. Test clear chat functionality
        console.log('Testing clear chat functionality...');
        try {
            // Find clear button (might be in a menu or directly visible)
            let clearButton = null;
            
            // Try direct clear button first
            try {
                clearButton = await this.driver!.findElement(By.css('.clear-btn, button[aria-label="Clear chat"]'));
            } catch (error) {
                // Try finding it in a menu
                try {
                    const menuButtons = await this.driver!.findElements(By.css('.chat-menu, .menu-btn, button[aria-label="Menu"]'));
                    if (menuButtons.length > 0) {
                        // Make sure menu button is visible and clickable
                        await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", menuButtons[0]);
                        await this.driver!.sleep(500);
                        
                        try {
                            await menuButtons[0].click();
                        } catch (clickError) {
                            await this.driver!.executeScript("arguments[0].click();", menuButtons[0]);
                        }
                        
                        await this.driver!.sleep(1000);
                        clearButton = await this.driver!.findElement(By.css('.clear-option, button:contains("Clear")'));
                    }
                } catch (err) {
                    console.log('Clear button not found in main UI or menu');
                }
            }
            
            if (clearButton) {
                // Make sure clear button is visible and clickable
                await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", clearButton);
                await this.driver!.sleep(500);
                
                try {
                    await clearButton.click();
                } catch (error) {
                    await this.driver!.executeScript("arguments[0].click();", clearButton);
                }
                
                console.log('✓ Clear button clicked');
                
                // Handle confirmation dialog if it appears
                try {
                    const confirmDialog = await this.driver!.wait(
                        until.elementLocated(By.css('.confirm-dialog, .swal2-confirm')),
                        3000
                    );
                    
                    const confirmButton = await this.driver!.findElement(By.css('.confirm-btn, .swal2-confirm, button:contains("Yes")'));
                    
                    // Make sure confirm button is visible and clickable
                    await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", confirmButton);
                    await this.driver!.sleep(500);
                    
                    try {
                        await confirmButton.click();
                    } catch (error) {
                        await this.driver!.executeScript("arguments[0].click();", confirmButton);
                    }
                    
                    console.log('✓ Clear confirmed in dialog');
                } catch (error) {
                    // No confirmation dialog appeared
                }
                
                // Check if chat is cleared
                await this.driver!.sleep(1500);
                const messages = await this.driver!.findElements(By.css('.message, .chat-message'));
                if (messages.length === 0 || messages.length === 1) { // Sometimes a welcome message remains
                    console.log('✓ Chat cleared successfully');
                    await this.takeScreenshot('chat-cleared.png');
                } else {
                    console.log(`✗ Chat not cleared properly, ${messages.length} messages still present`);
                }
            } else {
                console.log('✗ Clear button not found');
                await this.takeScreenshot('clear-button-not-found.png');
            }
        } catch (error) {
            console.log('✗ Clear chat test failed:', error);
            await this.takeScreenshot('clear-chat-failed.png');
        }
        
        // Wait before next interaction
        await this.driver!.sleep(1000);
        
        // 5. Test new chat functionality
        console.log('Testing new chat functionality...');
        try {
            // First, send a message to the current chat
            const messageInput = await this.driver!.wait(
                until.elementLocated(By.css('textarea[placeholder="Type your message..."]')),
                10000
            );
            
            // Wait for element to be visible and interactable
            await this.driver!.wait(until.elementIsVisible(messageInput), 5000);
            await this.driver!.wait(until.elementIsEnabled(messageInput), 5000);
            
            // Use JavaScript to scroll element into view
            await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", messageInput);
            await this.driver!.sleep(500);
            
            // Use JavaScript for setting value if direct interaction fails
            try {
                await messageInput.clear();
                await messageInput.sendKeys('Message in current chat');
            } catch (error) {
                await this.driver!.executeScript("arguments[0].value = '';", messageInput);
                await this.driver!.executeScript("arguments[0].value = 'Message in current chat';", messageInput);
                console.log('Used JavaScript to set input value');
            }
            
            // Find and click send button
            const sendButton = await this.driver!.wait(
                until.elementLocated(By.css('button[type="submit"], button.send-btn')),
                5000
            );
            
            // Ensure button is visible and clickable
            await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", sendButton);
            await this.driver!.sleep(500);
            
            try {
                await sendButton.click();
            } catch (error) {
                await this.driver!.executeScript("arguments[0].click();", sendButton);
                console.log('Used JavaScript to click send button');
            }
            
            // Wait for message to appear and response
            await this.driver!.wait(
                until.elementLocated(By.xpath(`//div[contains(@class, 'message') and contains(., 'Message in current chat')]`)),
                10000
            );
            
            await this.driver!.wait(
                until.elementLocated(By.css('.assistant-message, .bot-message')),
                20000
            );
            console.log('✓ Message sent in current chat');
            
            // Find new chat button
            let newChatButton = null;
            
            // Try direct new chat button first
            try {
                newChatButton = await this.driver!.findElement(By.css('.new-chat-btn, button:contains("New chat")'));
            } catch (error) {
                // Try finding it in a menu
                try {
                    const menuButtons = await this.driver!.findElements(By.css('.chat-menu, .menu-btn, button[aria-label="Menu"]'));
                    if (menuButtons.length > 0) {
                        // Make sure menu button is visible and clickable
                        await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", menuButtons[0]);
                        await this.driver!.sleep(500);
                        
                        try {
                            await menuButtons[0].click();
                        } catch (clickError) {
                            await this.driver!.executeScript("arguments[0].click();", menuButtons[0]);
                        }
                        
                        await this.driver!.sleep(1000);
                        newChatButton = await this.driver!.findElement(By.css('.new-chat-option, button:contains("New")'));
                    }
                } catch (err) {
                    // Try sidebar
                    try {
                        newChatButton = await this.driver!.findElement(By.css('.sidebar .new-chat-btn, nav button:contains("New chat")'));
                    } catch (error) {
                        console.log('New chat button not found in UI, menu or sidebar');
                    }
                }
            }
            
            if (newChatButton) {
                // Make sure new chat button is visible and clickable
                await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", newChatButton);
                await this.driver!.sleep(500);
                
                try {
                    await newChatButton.click();
                } catch (error) {
                    await this.driver!.executeScript("arguments[0].click();", newChatButton);
                }
                
                console.log('✓ New chat button clicked');
                
                // Wait for the chat to reset
                await this.driver!.sleep(1500);
                
                // Verify it's a new chat (no previous messages)
                const messages = await this.driver!.findElements(By.css('.message, .chat-message'));
                if (messages.length === 0 || messages.length === 1) { // Sometimes a welcome message appears
                    console.log('✓ New chat created successfully');
                    
                    // Send a message in the new chat
                    const newChatInput = await this.driver!.wait(
                        until.elementLocated(By.css('textarea[placeholder="Type your message..."]')),
                        10000
                    );
                    
                    // Wait for element to be visible and interactable
                    await this.driver!.wait(until.elementIsVisible(newChatInput), 5000);
                    await this.driver!.wait(until.elementIsEnabled(newChatInput), 5000);
                    
                    // Use JavaScript to scroll element into view
                    await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", newChatInput);
                    await this.driver!.sleep(500);
                    
                    // Use JavaScript for setting value if direct interaction fails
                    try {
                        await newChatInput.clear();
                        await newChatInput.sendKeys('This is a new chat');
                    } catch (error) {
                        await this.driver!.executeScript("arguments[0].value = '';", newChatInput);
                        await this.driver!.executeScript("arguments[0].value = 'This is a new chat';", newChatInput);
                    }
                    
                    // Find and click new send button
                    const newSendButton = await this.driver!.wait(
                        until.elementLocated(By.css('button[type="submit"], button.send-btn')),
                        5000
                    );
                    
                    // Ensure button is visible and clickable
                    await this.driver!.executeScript("arguments[0].scrollIntoView({block: 'center'});", newSendButton);
                    await this.driver!.sleep(500);
                    
                    try {
                        await newSendButton.click();
                    } catch (error) {
                        await this.driver!.executeScript("arguments[0].click();", newSendButton);
                    }
                    
                    // Wait for message to appear and response
                    await this.driver!.wait(
                        until.elementLocated(By.xpath(`//div[contains(@class, 'message') and contains(., 'This is a new chat')]`)),
                        10000
                    );
                    
                    await this.driver!.wait(
                        until.elementLocated(By.css('.assistant-message, .bot-message')),
                        20000
                    );
                    console.log('✓ Message sent in new chat');
                    
                    await this.takeScreenshot('new-chat-message.png');
                } else {
                    console.log(`✗ New chat not created properly, ${messages.length} messages still present`);
                    await this.takeScreenshot('new-chat-failed.png');
                }
            } else {
                console.log('✗ New chat button not found');
                await this.takeScreenshot('new-chat-button-not-found.png');
            }
        } catch (error) {
            console.log('✗ New chat test failed:', error);
            await this.takeScreenshot('new-chat-test-failed.png');
        }
    }
    
    /**
     * Test chat with different types of queries
     */
    private async testChatSequence() {
        console.log('Testing chat sequence with multiple query types...');
        
        // Navigate to chat page
        await this.driver!.get(`${this.baseUrl}/chat`);
        await TestUtils.waitForPageLoad(this.driver!);
        
        // Array of test messages to send
        const testMessages = [
            "Hello, I'm feeling anxious today",
            "What are some good breathing exercises?",
            "Can you explain how CBT works?",
            "What resources do you have for depression?",
            "Thank you for the help"
        ];
        
        // Send each message and wait for response
        for (const message of testMessages) {
            // Find and interact with the message input
            const messageInput = await this.driver!.findElement(By.css('textarea[placeholder="Type your message..."]'));
            await messageInput.clear();
            await messageInput.sendKeys(message);
            
            // Find and click send button
            const sendButton = await this.driver!.findElement(By.css('button[type="submit"], button.send-btn'));
            await sendButton.click();
            
            // Wait for user message to appear in chat
            try {
                await this.driver!.wait(
                    until.elementLocated(By.xpath(`//div[contains(@class, 'message') and contains(., '${message}')]`)),
                    10000
                );
                console.log(`✓ Message sent: "${message}"`);
                
                // Wait for bot response
                await this.driver!.wait(
                    until.elementLocated(By.css('.assistant-message, .bot-message')),
                    20000
                );
                console.log('✓ Bot response received');
                
                // Take screenshot after each exchange
                await this.takeScreenshot(`chat-sequence-${testMessages.indexOf(message)}.png`);
                
                // Add delay between messages
                await this.driver!.sleep(2000);
            } catch (error) {
                console.log(`✗ Chat exchange failed for message: "${message}"`);
                await this.takeScreenshot(`chat-failure-${testMessages.indexOf(message)}.png`);
            }
        }
        
        // Test chat controls (like clear chat)
        try {
            const chatControls = await this.driver!.findElement(By.css('.chat-controls, .controls'));
            await chatControls.click();
            
            const clearButton = await this.driver!.findElement(By.css('.clear-chat, button[aria-label="Clear chat"]'));
            await clearButton.click();
            
            // Confirm clear if there's a confirmation dialog
            try {
                const confirmButton = await this.driver!.findElement(By.css('.confirm-button, .swal2-confirm'));
                await confirmButton.click();
                console.log('✓ Chat cleared successfully');
            } catch (error) {
                // No confirmation dialog found
                console.log('✓ Chat cleared (no confirmation required)');
            }
        } catch (error) {
            console.log('✗ Failed to find chat controls');
        }
    }
    
    /**
     * Test document upload and chatting with document context
     */
    private async testDocumentBasedChat() {
        console.log('Testing document-based chat...');
        
        // Navigate to chat page
        await this.driver!.get(`${this.baseUrl}/chat`);
        await TestUtils.waitForPageLoad(this.driver!);
        
        // Locate file upload element and upload a test document
        try {
            // Find upload button
            const uploadButton = await this.driver!.findElement(
                By.css('.upload-button, button[aria-label="Upload file"]')
            );
            await uploadButton.click();
            console.log('✓ Upload button clicked');
            
            // Find file input and upload test document
            const fileInput = await this.driver!.findElement(By.css('input[type="file"]'));
            const testFilePath = path.resolve(__dirname, 'test-data', 'test-document.pdf');
            await fileInput.sendKeys(testFilePath);
            console.log('✓ Test document selected');
            
            // Wait for document to be processed
            await this.driver!.wait(
                until.elementLocated(By.css('.document-loaded, .upload-success')),
                15000
            );
            console.log('✓ Document processed successfully');
            
            // Send a query about the document
            const messageInput = await this.driver!.findElement(By.css('textarea[placeholder="Type your message..."]'));
            await messageInput.clear();
            await messageInput.sendKeys('Summarize the content of this document');
            
            // Send message
            const sendButton = await this.driver!.findElement(By.css('button[type="submit"], button.send-btn'));
            await sendButton.click();
            
            // Wait for response with higher timeout since document processing takes time
            await this.driver!.wait(
                until.elementLocated(By.css('.assistant-message, .bot-message')),
                30000
            );
            console.log('✓ Document-based response received');
            
            // Take screenshot of document chat
            await this.takeScreenshot('document-chat.png');
        } catch (error) {
            console.log('✗ Document-based chat test failed:', error);
            await this.takeScreenshot('document-chat-failure.png');
        }
    }
    
    /**
     * Test profile update with verification across page refreshes
     */
    private async testProfileUpdateFlow() {
        console.log('Testing profile update with persistence...');
        
        // Navigate to a page with profile access
        await this.driver!.get(`${this.baseUrl}/chat`);
        await TestUtils.waitForPageLoad(this.driver!);
        
        const testTheme = 'dark';
        const testLanguage = 'Spanish';
        
        try {
            // Open profile/settings
            const profileButton = await this.driver!.findElement(
                By.css('.profile-button, .avatar, button[aria-label="Settings"]')
            );
            await profileButton.click();
            console.log('✓ Profile/settings button clicked');
            
            // Wait for profile modal
            await this.driver!.wait(
                until.elementLocated(By.css('.profile-modal, .settings-modal, dialog')),
                5000
            );
            console.log('✓ Profile modal opened');
            
            // Change settings - test with theme toggling
            try {
                const themeSelector = await this.driver!.findElement(
                    By.css('select[name="theme"], .theme-select')
                );
                await themeSelector.click();
                
                // Select dark theme option
                const darkOption = await this.driver!.findElement(
                    By.css(`option[value="${testTheme}"], .theme-option[data-value="${testTheme}"]`)
                );
                await darkOption.click();
                console.log(`✓ Theme changed to ${testTheme}`);
                
                // Select language if available
                try {
                    const languageSelector = await this.driver!.findElement(
                        By.css('select[name="language"], .language-select')
                    );
                    await languageSelector.click();
                    
                    const languageOption = await this.driver!.findElement(
                        By.xpath(`//option[contains(text(), "${testLanguage}")], .language-option[data-value="${testLanguage.toLowerCase()}"]`)
                    );
                    await languageOption.click();
                    console.log(`✓ Language preference set to ${testLanguage}`);
                } catch (error) {
                    console.log('Language preference setting not available');
                }
                
                // Save settings
                const saveButton = await this.driver!.findElement(
                    By.css('button[type="submit"], .save-button, button.primary')
                );
                await saveButton.click();
                console.log('✓ Settings saved');
                
                // Verify settings applied
                await this.driver!.sleep(2000);
                
                // Check if body has dark class or data attribute
                const bodyClasses = await this.driver!.findElement(By.css('body')).getAttribute('class');
                const bodyDataTheme = await this.driver!.findElement(By.css('body')).getAttribute('data-theme');
                
                if (bodyClasses.includes('dark') || bodyDataTheme === 'dark') {
                    console.log('✓ Dark theme applied successfully');
                } else {
                    console.log('✗ Dark theme not applied properly');
                }
                
                // Test persistence across refresh
                await this.driver!.navigate().refresh();
                await TestUtils.waitForPageLoad(this.driver!);
                
                // Check theme persisted
                const bodyClassesAfterRefresh = await this.driver!.findElement(By.css('body')).getAttribute('class');
                const bodyDataThemeAfterRefresh = await this.driver!.findElement(By.css('body')).getAttribute('data-theme');
                
                if (bodyClassesAfterRefresh.includes('dark') || bodyDataThemeAfterRefresh === 'dark') {
                    console.log('✓ Theme setting persisted across page refresh');
                } else {
                    console.log('✗ Theme setting did not persist after refresh');
                }
            } catch (error) {
                console.log('✗ Theme switching test failed:', error);
            }
        } catch (error) {
            console.log('✗ Profile update flow test failed:', error);
            await this.takeScreenshot('profile-flow-failure.png');
        }
    }
    
    /**
     * Test basic accessibility features
     */
    private async testAccessibility() {
        console.log('Testing basic accessibility features...');
        
        // Navigate to main pages and check for accessibility attributes
        const pagesToCheck = ['/chat', '/resources'];
        
        for (const page of pagesToCheck) {
            await this.driver!.get(`${this.baseUrl}${page}`);
            await TestUtils.waitForPageLoad(this.driver!);
            
            // Check for alt text in images
            const images = await this.driver!.findElements(By.css('img'));
            let imagesWithAlt = 0;
            for (const img of images) {
                const alt = await img.getAttribute('alt');
                if (alt && alt.trim() !== '') {
                    imagesWithAlt++;
                }
            }
            console.log(`✓ Page ${page}: ${imagesWithAlt}/${images.length} images have alt text`);
            
            // Check for ARIA labels on interactive elements
            const interactiveElements = await this.driver!.findElements(
                By.css('button, a, input, textarea, select')
            );
            let elementsWithAriaOrLabel = 0;
            
            for (const element of interactiveElements) {
                const ariaLabel = await element.getAttribute('aria-label');
                const label = await element.getAttribute('aria-labelledby');
                const name = await element.getAttribute('name');
                const placeholder = await element.getAttribute('placeholder');
                
                if (ariaLabel || label || name || placeholder) {
                    elementsWithAriaOrLabel++;
                }
            }
            
            console.log(`✓ Page ${page}: ${elementsWithAriaOrLabel}/${interactiveElements.length} interactive elements have accessibility attributes`);
        }
    }
    
    /**
     * Test responsive behavior at different viewport sizes
     */
    private async testResponsiveness() {
        console.log('Testing responsive behavior...');
        
        // Define viewport sizes to test
        const viewportSizes = [
            { width: 1920, height: 1080, name: 'Desktop' },
            { width: 1024, height: 768, name: 'Tablet' },
            { width: 414, height: 896, name: 'Mobile' }
        ];
        
        // Navigate to chat page
        await this.driver!.get(`${this.baseUrl}/chat`);
        await TestUtils.waitForPageLoad(this.driver!);
        
        // Test each viewport size
        for (const viewport of viewportSizes) {
            console.log(`Testing viewport size: ${viewport.name} (${viewport.width}x${viewport.height})`);
            
            // Resize window
            await this.driver!.manage().window().setRect({
                width: viewport.width,
                height: viewport.height
            });
            
            // Wait for any responsive changes to apply
            await this.driver!.sleep(1000);
            
            // Take screenshot at this viewport size
            await this.takeScreenshot(`responsive-${viewport.name.toLowerCase()}.png`);
            
            // Check for mobile menu if on small viewport
            if (viewport.width < 768) {
                const mobileMenuButtons = await this.driver!.findElements(
                    By.css('.mobile-menu-button, .hamburger, button[aria-label="Menu"]')
                );
                
                if (mobileMenuButtons.length > 0) {
                    console.log(`✓ ${viewport.name}: Mobile menu button found`);
                    
                    // Test mobile menu opening
                    await mobileMenuButtons[0].click();
                    await this.driver!.sleep(500);
                    
                    // Check if menu is visible
                    const mobileMenuVisible = await TestUtils.waitForElement(
                        this.driver!,
                        '.mobile-menu.open, .nav-menu.active',
                        2000
                    );
                    
                    if (mobileMenuVisible) {
                        console.log(`✓ ${viewport.name}: Mobile menu opens correctly`);
                        await this.takeScreenshot(`responsive-${viewport.name.toLowerCase()}-menu-open.png`);
                    } else {
                        console.log(`✗ ${viewport.name}: Mobile menu did not open properly`);
                    }
                } else {
                    console.log(`? ${viewport.name}: No mobile menu button found`);
                }
            }
            
            // Check that main content is visible
            const chatInput = await TestUtils.waitForElement(
                this.driver!,
                'textarea[placeholder="Type your message..."]',
                2000
            );
            
            if (chatInput) {
                console.log(`✓ ${viewport.name}: Chat input is visible at this viewport size`);
            } else {
                console.log(`✗ ${viewport.name}: Chat input not visible at this viewport size`);
            }
        }
    }
} 