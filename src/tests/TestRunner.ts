import { PublicPagesTest } from './PublicPagesTest';
import { AuthenticationTest } from './AuthenticationTest';
import { ChatInterfaceTest } from './ChatInterfaceTest';
import { HistoryPageTest } from './HistoryPageTest';
import { FileUploadTest } from './FileUploadTest';
import { BaseTest } from './base/BaseTest';

interface TestDefinition {
    name: string;
    test: BaseTest;
}

class TestRunner {
    private tests: TestDefinition[] = [
        { name: 'Public Pages', test: new PublicPagesTest() },
        { name: 'Authentication', test: new AuthenticationTest() },
        { name: 'Chat Interface', test: new ChatInterfaceTest() },
        { name: 'History Page', test: new HistoryPageTest() },
        { name: 'File Upload', test: new FileUploadTest() }
    ];

    async runAll() {
        for (const { name, test } of this.tests) {
            try {
                console.log(`\nStarting ${name} test...`);
                await test.initialize();
                await test.run();
                console.log(`${name} test completed successfully!`);
            } catch (error) {
                console.error(`${name} test failed:`, error);
            } finally {
                await test.cleanup();
            }
        }
    }
}

// Run all tests
const runner = new TestRunner();
runner.runAll().catch(console.error); 