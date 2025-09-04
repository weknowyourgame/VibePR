export interface TimestampedStep {
    text?: string;
    timestamp: string;
    tool_calls?: ToolCall[];
    screenshot?: string;
    action?: string;
  }
  
export interface ToolCall {
    tool_name: string;
    args: any;
}

export interface AutoSetupInterface {
    setup_instructions: string;
    variables: Record<string, string>;
    repo_path: string;
}

export interface ExecuteTestInterface {
    test_name: string,
    test_description: string,
    prerequisites: string[],
    steps: string[],
    expected_result: string,
    priority: string,
}

export interface GenerateResponse {
    codebase_summary: string;
    pr_changes: string;
    tests: TestCase[];
    setup_instructions?: string;
  }

export interface TestCase {
    name: string;
    description: string;
    prerequisites: string[];
    steps: string[];
    expected_result: string;
    priority: string;
  }