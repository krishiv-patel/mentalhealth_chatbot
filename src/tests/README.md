# Mental Health Chatbot Tests

This directory contains end-to-end tests for the Mental Health Chatbot application using Selenium WebDriver.

## Prerequisites

- Node.js 16.x or higher
- Chrome browser installed
- Local development server running (`npm run dev`)
- Chrome WebDriver compatible with your Chrome version

## Running Tests

To run all tests:

```bash
npm test
```

To run specific tests, you can provide test names as arguments:

```bash
# Run only the chat-related tests
npm test -- chat

# Run multiple specific tests
npm test -- profile security
```

## Test Structure

- `base/` - Base test classes and utilities
- `test-data/` - Test files used for document upload tests
- `logs/` - Generated test logs

## Test Cases

### Basic Tests
- `PublicPagesTest` - Tests public pages accessibility
- `AuthenticationTest` - Tests login functionality
- `ChatInterfaceTest` - Tests basic chat interactions
- `HistoryPageTest` - Tests chat history page
- `FileUploadTest` - Tests file upload functionality
- `ModelsPageTest` - Tests AI model selection
- `ResourcesPageTest` - Tests resources page
- `ProfileTest` - Tests user profile management
- `DocumentPreviewTest` - Tests document preview functionality

### Advanced Tests
- `AdvancedUserFlowTest` - Tests complex user workflows across features
- `SecurityAndErrorTest` - Tests security features and error handling

## Adding New Tests

1. Create a new test file that extends either `BaseTest` or `AuthenticatedTest`
2. Implement the `run()` method with your test logic
3. Add your test to the `tests` array in `TestRunner.ts`

## Test Utilities

The `TestUtils` class provides helper methods for common testing tasks:

- `waitForElement()` - Wait for an element to be visible
- `safeClick()` - Safely click elements with retries
- `typeText()` - Type text into input fields
- `elementContainsText()` - Check if an element contains text
- `waitForPageLoad()` - Wait for page to fully load
- `scrollIntoView()` - Scroll to make an element visible
- `getCurrentPath()` - Get the current URL path
- `getTimestampString()` - Generate a timestamp for naming files
- `saveLogs()` - Save logs to a file
- `getBrowserLogs()` - Get browser console logs

## Test Data

For document tests to work properly, add these files to the `test-data` directory:

- `test-document.pdf` - A sample PDF document
- `test-document.docx` - A sample Word document (optional)
- `test-document.txt` - A sample text file (optional) 