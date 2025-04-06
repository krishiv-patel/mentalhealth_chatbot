import { Builder, WebDriver } from 'selenium-webdriver';
import 'chromedriver';

export abstract class BaseTest {
    protected driver: WebDriver | null = null;
    protected baseUrl: string = 'http://localhost:5173';

    async initialize() {
        this.driver = await new Builder().forBrowser('chrome').build();
        await this.driver.manage().window().maximize();
        await this.driver.manage().setTimeouts({ implicit: 5000 });
    }

    async cleanup() {
        if (this.driver) {
            await this.driver.quit();
            this.driver = null;
        }
    }

    protected async takeScreenshot(filename: string) {
        if (this.driver) {
            const screenshot = await this.driver.takeScreenshot();
            const fs = await import('fs');
            fs.writeFileSync(filename, screenshot, 'base64');
            console.log(`Screenshot saved as ${filename}`);
        }
    }

    abstract run(): Promise<void>;
} 