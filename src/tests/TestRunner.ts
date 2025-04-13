import { PublicPagesTest } from './PublicPagesTest';
import { AuthenticationTest } from './AuthenticationTest';
import { ChatInterfaceTest } from './ChatInterfaceTest';
import { HistoryPageTest } from './HistoryPageTest';
import { FileUploadTest } from './FileUploadTest';
import { ModelsPageTest } from './ModelsPageTest';
import { ResourcesPageTest } from './ResourcesPageTest';
import { ProfileTest } from './ProfileTest';
import { DocumentPreviewTest } from './DocumentPreviewTest';
import { AdvancedUserFlowTest } from './AdvancedUserFlowTest';
import { SecurityAndErrorTest } from './SecurityAndErrorTest';
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
        { name: 'File Upload', test: new FileUploadTest() },
        { name: 'Models Page', test: new ModelsPageTest() },
        { name: 'Resources Page', test: new ResourcesPageTest() },
        { name: 'Profile Functionality', test: new ProfileTest() },
        { name: 'Document Preview', test: new DocumentPreviewTest() },
        { name: 'Advanced User Flow', test: new AdvancedUserFlowTest() },
        { name: 'Security and Error Handling', test: new SecurityAndErrorTest() }
    ];

    // Run all tests sequentially
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

    // Run only specified tests
    async runSelected(testNames: string[]) {
        const testsToRun = this.tests.filter(({ name }) => 
            testNames.some(testName => name.toLowerCase().includes(testName.toLowerCase()))
        );

        if (testsToRun.length === 0) {
            console.log('No matching tests found. Available tests:');
            this.tests.forEach(({ name }) => console.log(`- ${name}`));
            return;
        }

        console.log(`Running ${testsToRun.length} selected tests...`);
        
        for (const { name, test } of testsToRun) {
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

// Parse command line arguments
const args = process.argv.slice(2);
const testRunner = new TestRunner();

if (args.length > 0) {
    // Run specific tests if provided as arguments
    testRunner.runSelected(args);
} else {
    // Run all tests
    testRunner.runAll();
} 