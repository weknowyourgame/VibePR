  import { type TimestampedStep } from "../config/interface";

  export function formatAgentSteps(steps: TimestampedStep[]): string {
    const formattedSteps: string[] = [];
  
    for (const step of steps) {

      const toolCallLines: string[] = [];
      if (step.tool_calls) {
        for (const call of step.tool_calls) {

          const args = call.tool_name === "str_replace_editor"
            ? "[REDACTED]"
            : call.args;
          toolCallLines.push(`${call.tool_name}: ${args}`);
        }
      }
  

      let stepText = "";
      if (step.text && step.text.trim()) {

        stepText = step.text.replace(/^-+\s*/, '');
        const parts = stepText.split('. ', 2);
        
        //@ts-ignore
        stepText = parts.length > 1 ? parts[1] : parts[0];
      }
  

      if (stepText || toolCallLines.length > 0) {

        const formattedStep = `\`\`\`\n${stepText ? stepText + '\n' : ''}${toolCallLines.join('\n')}\n\`\`\``;
        formattedSteps.push(formattedStep);
      }
    }
  
    return formattedSteps.join('\n');
  }
  

  export function setupInProgressComment(steps: TimestampedStep[]): string {
    return `🔧 Setting up test environment...
  
  <details>
  <summary>Agent Steps</summary>
  
  ${formatAgentSteps(steps)}
  </details>`;
  }
  

  export function errorComment(error: string | null | undefined): string {
    return `❌ Something went wrong: 
  \`\`\`
  ${error || 'Unknown error'}
  \`\`\``;
  }
  

  export function setupErrorComment(error: string | null | undefined, steps: TimestampedStep[]): string {
    return `❌ Error setting up test environment: 
  \`\`\`
  ${error || 'Unknown error'}
  \`\`\`
  
  <details>
  <summary>Agent Steps</summary>
  
  ${formatAgentSteps(steps)}
  </details>`;
  }
  
  export function setupCompleteComment(steps: TimestampedStep[]): string {
    return `✅ Setup complete! Running tests...
  
  <details>
  <summary>Agent Steps</summary>
  
  ${formatAgentSteps(steps)}
  </details>`;
  }
  
  export function testStartingComment(testNumber: number, testName: string): string {
    return `🧪 Running test ${testNumber}: ${testName}...`;
  }
  
  export function testInProgressComment(
    testNumber: number,
    testName: string,
    steps: TimestampedStep[]
  ): string {
    return `🧪 Running test ${testNumber}: ${testName}...
  
  <details>
  <summary>Agent Steps</summary>
  
  ${formatAgentSteps(steps)}
  </details>`;
  }
  
  export function testResultComment(
    testNumber: number,
    testName: string,
    success: boolean,
    error: string | null | undefined,
    notes: string | null | undefined,
    steps: TimestampedStep[]
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
  
  export function testSummaryComment(passedTests: number, totalTests: number): string {
    const allPassed = passedTests === totalTests;
    const status = allPassed
      ? "🎉 All tests passed!"
      : "⚠️ Some tests failed. Please check the individual test results above for details.";
  
    return `# Test Results 📊
  
  ${passedTests}/${totalTests} tests passed
  
  ${status}`;
  }
  
  export function launchingDesktopComment(): string {
    return "🚀 Launching desktop...";
  }
  
  export function launchingDesktopInstanceComment(streamUrl: string): string {
    return `🚀 Ubuntu instance started!
  
  <a href="${streamUrl}">Interactive stream</a>`;
  }
  
  export function launchingDesktopErrorComment(streamUrl: string, error: string): string {
    return `🚀 Ubuntu instance started!
  
  <a href="${streamUrl}">Interactive stream</a>
  
  ⚠️ Error fetching GitHub variables, continuing setup:
  \`\`\`
  ${error}
  \`\`\``;
  }
  
  export const comments = {
    formatAgentSteps,
    setupInProgressComment,
    errorComment,
    setupErrorComment,
    setupCompleteComment,
    testStartingComment,
    testInProgressComment,
    testResultComment,
    testSummaryComment,
    launchingDesktopComment,
    launchingDesktopInstanceComment,
    launchingDesktopErrorComment,
  };
  