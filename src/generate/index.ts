import { addPrComment, createOctokit, editPrComment, getFileContent, getPrFiles, getTreeContent } from "../github/github";
import { FileAnalysisResponse, GenerateResponse, type GitHubFile, type PullRequest, type Repo, type Review, VibePRConfig } from "../schema";
import { z } from "zod";
import { Octokit } from '@octokit/rest';
import { callGatewayAI } from "../gateway";
import { ANALYZE_FILES_SYSTEM_PROMPT, analyze_files_user_prompt, GENERATE_TESTS_SYSTEM_PROMPT, generate_tests_user_prompt, SUMMARIZE_FILE_SYSTEM_PROMPT, summarize_files_user_prompt } from "./prompts";
import yaml from 'js-yaml';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Summarize a file
export async function summarizeFile(repo: z.infer<typeof Repo>, filename: string) {
    try {
        const fileContent = await getFileContent(octokit, repo.owner, repo.name, filename);
        const content = Buffer.from(fileContent || '', 'base64').toString('utf-8');

        // pass through AI gateway
        const response = await callGatewayAI({
            provider: "google-ai-studio",
            modelId: "gemini-2.5-flash",
            prompt: summarize_files_user_prompt(content),
            systemPrompt: SUMMARIZE_FILE_SYSTEM_PROMPT,
            type: "generate"
        });
        return response;
    } catch (error) {
        console.error(error);
        throw new Error(`Failed to summarize file: ${error}`);
    }
}

export async function generateTasks(repo: z.infer<typeof Repo>, pr: z.infer<typeof PullRequest>, review?: z.infer<typeof Review>) {
    let summaryCommentId: number | null = null;
    let vibePrConfig: z.infer<typeof VibePRConfig> | null = null;
    let fileChangesStr = '';

    try {
        try {
            summaryCommentId = await addPrComment(
                octokit,
                repo.owner,
                repo.name, 
                pr.number,
                "🔍 Analyzing PR changes and preparing to run tests..."
            );
        } catch (error) {
            console.error(error);
            throw new Error(`Failed to add comment: ${error}`);
        }

        // Get PR details 
        const prTitle = pr.title;
        const prDescription = pr.body || '';
        
        // Get changed files
        const changedFiles = await getPrFiles(octokit, repo.owner, repo.name, pr.number);

        // Get the changes in the files
        const fileChanges: z.infer<typeof GitHubFile>[] = [];

        changedFiles.forEach(file => {
            fileChanges.push({
                filename: file.filename,
                status: file.status,
                additions: file.additions,
                deletions: file.deletions,
                changes: file.changes,
                patch: file.patch,
            });
        });
        
        // Create a string representation of file changes for the comment
        fileChangesStr = fileChanges.map(file => `${file.filename}: +${file.additions} -${file.deletions}`).join('\n');
        
        // Get tree content
        const treeContent = await getTreeContent(octokit, repo.owner, repo.name);
        
        // Analyze file tree
        let fileAnalysisResult;
        try {
            const response = await callGatewayAI({
                provider: "google-ai-studio",
                modelId: "gemini-2.5-flash",
                prompt: analyze_files_user_prompt(treeContent),
                systemPrompt: ANALYZE_FILES_SYSTEM_PROMPT,
                type: "generate"
            });
            const fileAnalysisResponse = FileAnalysisResponse.safeParse(response);
            if (!fileAnalysisResponse.success) {
                console.error(fileAnalysisResponse.error);
                throw new Error(`Failed to parse file tree: ${fileAnalysisResponse.error}`);
            }
            fileAnalysisResult = fileAnalysisResponse.data;
        } catch (error) {
            console.error(error);
            throw new Error(`Failed to analyze file tree: ${error}`);
        }

        // Get content and summarize important files
        const fileSummariesPromises = fileAnalysisResult.files.map(file => 
            summarizeFile(repo, file.path)
        );
        
        const fileSummaries = await Promise.all(fileSummariesPromises);
        const codebaseContext = fileSummaries.join('\n');

        // Get Readme
        let readmeContent = '';
        try {
            const readmeFile = await octokit.repos.getContent({
                owner: repo.owner,
                repo: repo.name,
                path: 'README.md',
                ref: pr.head.ref
            });
    
            if (Array.isArray(readmeFile.data)) {
                throw new Error('README.md should not be a directory');
            }
    
            if ('content' in readmeFile.data && readmeFile.data.encoding === 'base64') {
                readmeContent = Buffer.from(readmeFile.data.content, 'base64').toString('utf-8');
            } else {
                throw new Error('Could not decode README content');
            }
        } catch (error) {
            readmeContent = `Error reading README: ${error}`;
        }
    
        // Get Yml file content
        try {
            const ymlFile = await octokit.repos.getContent({
                owner: repo.owner,
                repo: repo.name,
                path: '.yaml',
                ref: pr.head.ref
            });
    
            if (Array.isArray(ymlFile.data)) {
                throw new Error('.yaml should not be a directory');
            }
    
            if ('content' in ymlFile.data && ymlFile.data.encoding === 'base64') {
                const ymlContent = Buffer.from(ymlFile.data.content, 'base64').toString('utf-8');
                const parsedYaml = yaml.load(ymlContent);
                vibePrConfig = VibePRConfig.parse(parsedYaml);
                
                if (review && review.generate) {
                    review.generate.vibePR_yaml_content = ymlContent;
                }
            }
        } catch (error) {
            console.log('No .yaml found or error parsing it');
        }
    
        // Prepare test prompt
        const testPrompt = generate_tests_user_prompt(
            prTitle,
            prDescription,
            JSON.stringify(fileChanges),
            readmeContent,
            treeContent,
            JSON.stringify(vibePrConfig),
            codebaseContext
        );

        // Generate test cases
        const generateResponse = await callGatewayAI({
            provider: "google-ai-studio",
            modelId: "gemini-2.5-flash",
            prompt: testPrompt,
            systemPrompt: GENERATE_TESTS_SYSTEM_PROMPT,
            type: "generate"
        });

        // Parse the response
        const parsedResponse = GenerateResponse.safeParse(generateResponse);
        if (!parsedResponse.success) {
            throw new Error(`Failed to parse generate response: ${parsedResponse.error}`);
        }
        
        // Extract validated response
        const response = parsedResponse.data;

        // Update review if we have one
        if (review && review.generate) {
            review.generate.codebase_summary = response.codebase_summary;
            review.generate.pr_changes_summary = response.pr_changes;
            review.generate.auto_setup_instructions = response.setup_instructions;
            review.generate.generated_tests = response.tests;
            
            // These fields should be added to the schema if needed
            // review.generate.status = "complete";
            // review.generate.completed_at = new Date().toISOString();
            
            if (review.totalTests === undefined) {
                review.totalTests = response.tests.length;
            }
            
            // Uncomment when this function is available
            // await upsertReview(review);
        }

        // Format test results for the comment
        const testDetails = response.tests.map((test, i) => {
            const priorityIcons: Record<string, string> = {
                high: '❗️❗️❗️',
                medium: '❗️❗️',
                low: '❗️'
            };

            return `
### ${i + 1}: ${test.name} ${priorityIcons[test.priority] || ''}

**Description**: ${test.description}

**Prerequisites**:
${test.prerequisites.map((prereq: string) => `- ${prereq}`).join('\n')}

**Steps**:
${test.steps.map((step: string, idx: number) => `${idx + 1}. ${step}`).join('\n')}

**Expected Result**: ${test.expected_result}
`;
        });

        const comment = `# VibePR Review
- PR: #${pr.number}
- Commit: ${pr.head.sha.slice(0, 7)}

## Codebase Summary
${response.codebase_summary}

## PR Changes
${response.pr_changes}

## Setup Instructions
${vibePrConfig ? "Fetched from vibePR.yaml" : response.setup_instructions || 'No setup instructions provided.'}

## Generated Test Cases
${testDetails.join('')}

<details>
<summary>Raw Changes Analyzed</summary>

\`\`\`diff
${fileChangesStr}
\`\`\`
</details>`;

        if (summaryCommentId) {
            await editPrComment(
                octokit,
                repo.owner,
                repo.name,
                summaryCommentId,
                comment
            );
        }

        return response;

    } catch (error) {
        const errorComment = `❌ Error while analyzing PR and generating tests:

\`\`\`
${error}
\`\`\`
`;
        if (summaryCommentId) {
            await editPrComment(
                octokit,
                repo.owner,
                repo.name,
                summaryCommentId,
                errorComment
            );
        }
        if (review) {
            if (review.generate) {
                // review.generate.status = "failed";
                // review.generate.error = String(error);
            }
            review.status = "failed";
            // Uncomment when this function is available
            // await upsertReview(review);
        }
        console.error(error);
        throw new Error(`Failed to generate tasks: ${error}`);
    }
}