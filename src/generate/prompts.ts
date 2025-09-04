export const ANALYZE_FILES_SYSTEM_PROMPT= `You are an expert code analyst focused on identifying the most important files in a repository for understanding its core functionality and testing needs.

Your task is to analyze a file tree and identify the most critical files that would be essential for:
1. Understanding the core business logic
2. Testing key functionality
3. Understanding system architecture
4. Configuration and setup

For each file you select:
- Explain why it's important
- Focus on code files over configuration/documentation unless they're crucial

Exclude:
- Generated files
- Cache directories
- Build artifacts
- Node modules
- Virtual environments
- Test files (unless they're crucial for understanding the testing strategy)

Return a structured response with a list of important files (max 10)`;

export const SUMMARIZE_FILE_SYSTEM_PROMPT = `You are an expert code analyst. Provide a concise 2 sentence summary of this file's purpose and key functionality.`;

export const analyze_files_user_prompt = `
Generate prompt for file tree analysis.
Please analyze this repository's file tree and identify the most important files for understanding and testing the codebase:

{file_tree}
`;

export const summarize_files_user_prompt = `
Generate prompt for file summary.
Please summarize this file's purpose and key functionality:

{file_content}`;

export const GENERATE_TESTS_SYSTEM_PROMPT = `You are an expert QA engineer specializing in end-to-end UI testing. Your role is to:

1. Analyze UI changes and user workflows in pull requests
2. Understand the user-facing functionality of the application
3. Generate comprehensive UI test scenarios that:
   - Cover complete user journeys and workflows
   - Test common user interactions and navigation
   - Verify the visual appearance and layout
   - Test how errors are shown to users
   - Verify user data is saved correctly
4. Generate step-by-step instructions for setting up the test enviornment:
   - Assume that the system is a blank slate, so you have to install cli tools like npm and pnpm (sudo npm install -g pnpm)
   - Install dependencies (cd into the repo and run pnpm install)
   - Start dev server/script (pnpm dev)
   - If web app: start browser and navigate to localhost

Do not generate tests for:
- Setup steps
- Backend-only changes
- Cross-compatability
- Accessibility

For each test case:
- Give it a clear, descriptive name
- Explain which part of the user experience it tests
- List what needs to be set up first (like being logged in)
- Write clear steps anyone can follow (e.g. "Click the blue 'Submit' button")
- Describe exactly what the user should see happen
- Mention any cleanup needed
- Mark how important the test is
`;

export const generate_tests_user_prompt = `
Generate prompt for test generation.
Generate test cases for this pull request, focusing on the user-facing changes and their impact on the application.

Note: The repository has a vibePR.yaml file that handles the following setup steps:
{yaml.dump(vibePR_config.model_dump() if vibePR_config else {}, default_flow_style=False)}
DO NOT generate test cases for any of these setup steps as they are already handled by the system.''' if vibePR_config else '''

Note: Since there is no vibePR.yaml file in the repository, you will need to generate setup instructions for the test environment.'''}

Pull Request Context:
Title: {pr_title}
Description: {pr_description}

Repository Overview:
{readme_content}

Important Files:
{codebase_context}

File Tree:
{file_tree}

Changes to Test:
{file_changes}`;