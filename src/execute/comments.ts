import { TimestampedStep } from '../schema';
import { z } from 'zod';

// format agent steps as code blocks and trim messages to 50 characters.
export function formatAgentSteps(steps: z.infer<typeof TimestampedStep>[]): string {
  const formattedSteps: string[] = [];

  for (const step of steps) {
    // Format tool calls
    const toolCallLines: string[] = [];
    if (step.toolCalls) {
      for (const call of step.toolCalls) {
        // Redact editor tool calls
        const args = call.toolName === "str_replace_editor" 
          ? "[REDACTED]" 
          : call.args;
        toolCallLines.push(`${call.toolName}: ${args}`);
      }
    }

    // Get step text if it exists
    let stepText = "";
    if (step.text && step.text.trim()) {
      // Get the step text without leading dash/bullet
      stepText = step.text.replace(/^-\s*/, '');
      // Split on first period to remove any numbering
      const parts = stepText.split(". ", 2);
      stepText = parts.length > 1 ? parts[1] : stepText ?? "";
    }

    // Only add step if there's text or tool calls
    if (stepText || toolCallLines.length > 0) {
      // Combine into code block with text only if it exists
      const formattedStep = `\`\`\`\n${stepText ? stepText + '\n' : ''}${toolCallLines.join('\n')}\n\`\`\``;
      formattedSteps.push(formattedStep);
    }
  }

  return formattedSteps.join("\n");
}


// comment for when setup is in progress.
export function setupInProgressComment(steps: z.infer<typeof TimestampedStep>[]): string {
    return `🔧 Setting up test environment...

    <details>
    <summary>Agent Steps</summary>

    ${formatAgentSteps(steps)}
    </details>`;
}


// error comment.
export function errorComment(error: string | null | undefined): string {
    return `❌ Something went wrong: 
    \`\`\`
    ${error}
    \`\`\``;
}

// comment for when setup encounters an error.
export function setupErrorComment(error: string | null | undefined, steps: z.infer<typeof TimestampedStep>[]): string {
    return `❌ Error setting up test environment: 
    
    \`\`\`
    ${error}
    \`\`\`

    <details>
    <summary>Agent Steps</summary>

    ${formatAgentSteps(steps)}
    </details>`;
}

// comment for when setup is complete.
export function setupCompleteComment(steps: z.infer<typeof TimestampedStep>[]): string {
    return `✅ Setup complete! Running tests...

    <details>
    <summary>Agent Steps</summary>

    ${formatAgentSteps(steps)}
    </details>`;
}

// comment for when a test is starting.
export function testStartingComment(testNumber: number, testName: string): string {
    return `🧪 Running test ${testNumber}: ${testName}...`;
}

// comment for when a test is in progress.
export function testInProgressComment(
  testNumber: number, 
  testName: string, 
  steps: z.infer<typeof TimestampedStep>[]
): string {
    return `🧪 Running test ${testNumber}: ${testName}...

    <details>
    <summary>Agent Steps</summary>

    ${formatAgentSteps(steps)}
    </details>`;
}

// comment for a test result.
export function testResultComment(
  testNumber: number,
  testName: string,
  success: boolean,
  error: string | null | undefined,
  notes: string | null | undefined,
  steps: z.infer<typeof TimestampedStep>[]
): string {
    const status = success ? "✅ Passed" : "❌ Failed";
    const errorSection = error ? `\nError: ${error}` : "";
    const notesSection = notes ? `\n${notes}` : "";
    return `${status}: Test ${testNumber}: ${testName}${errorSection}${notesSection}

    <details>
    <summary>Agent Steps</summary>

    ${formatAgentSteps(steps)}
    </details>`;
}

// comment summarizing test results.
export function testSummaryComment(passedTests: number, totalTests: number): string {
    const allPassed = passedTests === totalTests;
    const status = allPassed
    ? "🎉 All tests passed!"
    : "⚠️ Some tests failed. Please check the individual test results above for details.";

    return `# CodeCapy Test Results 📊

    ${passedTests}/${totalTests} tests passed
    ${status}`;
}

// comment for when a desktop is being launched.
export function launchingDesktopComment(): string {
    return "🚀 Launching Scrapybara desktop...";
}

// comment for when a desktop instance has been launched.
export function launchingDesktopInstanceComment(streamUrl: string): string {
    return `🚀 Scrapybara Ubuntu instance started!

    <a href="${streamUrl}">Interactive stream</a>`;
}

// comment for when there's an error launching a desktop instance.
export function launchingDesktopErrorComment(streamUrl: string, error: string): string {

    return `🚀 Scrapybara Ubuntu instance started!
    <a href="${streamUrl}">Interactive stream</a>
    ⚠️ Error fetching GitHub variables, continuing setup: 
    \`\`\`
    ${error}
    \`\`\``;
}
