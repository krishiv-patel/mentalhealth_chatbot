import { By, until, Key } from 'selenium-webdriver';
import { BaseTest } from './base/BaseTest';
import { TestUtils } from './base/TestUtils';

/**
 * Advanced test for security features and error handling
 * Tests authentication boundaries, input validation, and error responses
 */
export class SecurityAndErrorTest extends BaseTest {
    async run() {
        console.log('Running security and error handling tests...');
        
        if (!this.driver) {
            throw new Error('Driver not initialized');
        }
        
        try {
            // Test authentication boundaries
            await this.testAuthBoundaries();
            
            // Test input validation
            await this.testInputValidation();
            
            // Test error handling
            await this.testErrorHandling();
            
            // Test rate limiting if applicable
            await this.testRateLimiting();
            
            // Test security headers
            await this.testSecurityHeaders();
        } catch (error) {
            console.error('Security and error test failed:', error);
            await this.takeScreenshot(`security-test-failure-${TestUtils.getTimestampString()}.png`);
            throw error;
        }
    }
    
    /**
     * Test authentication boundaries by attempting to access protected routes
     */
    private async testAuthBoundaries() {
        console.log('Testing authentication boundaries...');
        
        // List of protected routes to test
        const protectedRoutes = [
            '/chat',
            '/history',
            '/profile',
            '/models'
        ];
        
        // Ensure we're logged out first
        await this.ensureLoggedOut();
        
        // Try to access each protected route
        for (const route of protectedRoutes) {
            await this.driver!.get(`${this.baseUrl}${route}`);
            await TestUtils.waitForPageLoad(this.driver!);
            
            // Check if redirected to login
            const currentUrl = await this.driver!.getCurrentUrl();
            
            if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
                console.log(`✓ Protected route ${route} correctly redirects to login`);
            } else {
                // Check if there's an error message or access denied
                const bodyText = await this.driver!.findElement(By.css('body')).getText();
                if (bodyText.includes('access denied') || 
                    bodyText.includes('unauthorized') || 
                    bodyText.includes('sign in') ||
                    bodyText.includes('log in')) {
                    console.log(`✓ Protected route ${route} shows access denied`);
                } else {
                    console.log(`✗ Protected route ${route} did not redirect to login or show access denied`);
                    await this.takeScreenshot(`auth-boundary-fail-${route.replace('/', '-')}.png`);
                }
            }
        }
    }
    
    /**
     * Ensure the user is logged out for auth testing
     */
    private async ensureLoggedOut() {
        // Navigate to home page
        await this.driver!.get(this.baseUrl);
        await TestUtils.waitForPageLoad(this.driver!);
        
        // Look for logout button if logged in
        try {
            const logoutElements = await this.driver!.findElements(By.css(
                'button.logout, a.logout, button:contains("Logout"), button:contains("Sign Out")'
            ));
            
            if (logoutElements.length > 0) {
                await logoutElements[0].click();
                await TestUtils.waitForPageLoad(this.driver!);
                console.log('Logged out for auth testing');
            }
        } catch (error) {
            // Already logged out or no logout button found
            console.log('Appears to be already logged out');
        }
    }
    
    /**
     * Test input validation by attempting to submit invalid inputs
     */
    private async testInputValidation() {
        console.log('Testing input validation...');
        
        // Test login form validation
        await this.driver!.get(`${this.baseUrl}/login`);
        await TestUtils.waitForPageLoad(this.driver!);
        
        // Test email validation
        try {
            const emailInput = await this.driver!.findElement(By.css('input[type="email"]'));
            await emailInput.clear();
            await emailInput.sendKeys('invalid-email');
            
            // Tab out to trigger validation
            await emailInput.sendKeys(Key.TAB);
            
            // Submit form
            const form = await this.driver!.findElement(By.css('form'));
            await form.submit();
            
            // Check for validation error
            try {
                await this.driver!.wait(
                    until.elementLocated(By.css('.error-message, .form-error, .invalid-feedback')),
                    3000
                );
                console.log('✓ Invalid email validation working');
            } catch (error) {
                console.log('✗ Invalid email validation not detected');
            }
        } catch (error) {
            console.log('Email validation test failed:', error);
        }
        
        // Test password validation
        try {
            // Find password input and test too short password
            const passwordInput = await this.driver!.findElement(By.css('input[type="password"]'));
            await passwordInput.clear();
            await passwordInput.sendKeys('short');
            
            // Tab out to trigger validation
            await passwordInput.sendKeys(Key.TAB);
            
            // Submit form
            const form = await this.driver!.findElement(By.css('form'));
            await form.submit();
            
            // Check for validation error
            try {
                await this.driver!.wait(
                    until.elementLocated(By.css('.error-message, .form-error, .invalid-feedback')),
                    3000
                );
                console.log('✓ Short password validation working');
            } catch (error) {
                console.log('✗ Short password validation not detected');
            }
        } catch (error) {
            console.log('Password validation test failed:', error);
        }
    }
    
    /**
     * Test how the application handles errors
     */
    private async testErrorHandling() {
        console.log('Testing error handling...');
        
        // Test 404 error page
        await this.driver!.get(`${this.baseUrl}/non-existent-page-${Date.now()}`);
        await TestUtils.waitForPageLoad(this.driver!);
        
        // Check for 404 page
        const bodyText = await this.driver!.findElement(By.css('body')).getText();
        if (bodyText.includes('404') || 
            bodyText.includes('not found') || 
            bodyText.includes('page doesn\'t exist')) {
            console.log('✓ 404 error page works correctly');
            await this.takeScreenshot('404-page.png');
        } else {
            console.log('✗ 404 error page not detected properly');
        }
        
        // Test invalid login credentials
        await this.driver!.get(`${this.baseUrl}/login`);
        await TestUtils.waitForPageLoad(this.driver!);
        
        try {
            const emailInput = await this.driver!.findElement(By.css('input[type="email"]'));
            const passwordInput = await this.driver!.findElement(By.css('input[type="password"]'));
            
            await emailInput.clear();
            await emailInput.sendKeys('nonexistent@example.com');
            
            await passwordInput.clear();
            await passwordInput.sendKeys('InvalidPassword123!');
            
            // Submit form
            const form = await this.driver!.findElement(By.css('form'));
            await form.submit();
            
            // Wait for error message
            try {
                await this.driver!.wait(
                    until.elementLocated(By.css('.error-message, .alert-danger, .notification-error')),
                    5000
                );
                console.log('✓ Invalid login credentials error handled correctly');
            } catch (error) {
                console.log('✗ Invalid login credentials error not shown properly');
            }
        } catch (error) {
            console.log('Login error handling test failed:', error);
        }
    }
    
    /**
     * Test rate limiting if applicable
     */
    private async testRateLimiting() {
        console.log('Testing rate limiting detection...');
        
        // Navigate to login page
        await this.driver!.get(`${this.baseUrl}/login`);
        await TestUtils.waitForPageLoad(this.driver!);
        
        // Try multiple rapid logins to potentially trigger rate limiting
        try {
            for (let i = 0; i < 5; i++) {
                console.log(`Rapid login attempt ${i+1}/5`);
                
                const emailInput = await this.driver!.findElement(By.css('input[type="email"]'));
                const passwordInput = await this.driver!.findElement(By.css('input[type="password"]'));
                
                await emailInput.clear();
                await emailInput.sendKeys(`test${i}@example.com`);
                
                await passwordInput.clear();
                await passwordInput.sendKeys('Test123!');
                
                // Submit form
                const form = await this.driver!.findElement(By.css('form'));
                await form.submit();
                
                // Brief wait before next attempt
                await this.driver!.sleep(300);
            }
            
            // Check for rate limit message
            const bodyText = await this.driver!.findElement(By.css('body')).getText();
            if (bodyText.includes('rate limit') || 
                bodyText.includes('too many attempts') || 
                bodyText.includes('try again later')) {
                console.log('✓ Rate limiting appears to be implemented');
                await this.takeScreenshot('rate-limit-detected.png');
            } else {
                console.log('? Rate limiting either not implemented or not triggered');
            }
        } catch (error) {
            console.log('Rate limiting test error:', error);
        }
    }
    
    /**
     * Test security headers
     */
    private async testSecurityHeaders() {
        console.log('Testing security headers...');
        
        // Get security headers using a script
        try {
            const headers = await this.driver!.executeScript<{
                csp: string | null;
                xframe: string | null;
                xss: string | null;
            }>(`
                return {
                    csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content'),
                    xframe: document.querySelector('meta[http-equiv="X-Frame-Options"]')?.getAttribute('content'),
                    xss: document.querySelector('meta[http-equiv="X-XSS-Protection"]')?.getAttribute('content')
                };
            `);
            
            console.log('Security headers found in meta tags:', headers);
            
            // Check if CSP is set
            if (headers.csp) {
                console.log('✓ Content-Security-Policy is set');
            } else {
                console.log('? Content-Security-Policy meta tag not found');
            }
            
            // Check if X-Frame-Options is set
            if (headers.xframe) {
                console.log('✓ X-Frame-Options is set');
            } else {
                console.log('? X-Frame-Options meta tag not found');
            }
            
            // Check if XSS Protection is set
            if (headers.xss) {
                console.log('✓ X-XSS-Protection is set');
            } else {
                console.log('? X-XSS-Protection meta tag not found');
            }
            
        } catch (error) {
            console.log('Security headers test failed:', error);
        }
    }
} 