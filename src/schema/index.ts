import { z } from "zod";

export const ToolCall = z.object({
  tool_name: z.string(),
  args: z.any(),
});

export const TimestampedStep = z.object({
  text: z.string(),
  timestamp: z.string(),
  tool_calls: ToolCall.array().optional(),
  screenshot: z.string().optional(),
  action: z.string().optional(),
  type: z.string().optional(),
  screenshot_url: z.string().optional()
});

export const AutoSetupInterface = z.object({
    setup_instructions: z.string(),
    variables: z.record(z.string(), z.string()),
    repo_path: z.string()
});

export const ExecuteTestInterface = z.object({
    test_name: z.string(),
    test_description: z.string(),
    prerequisites: z.array(z.string()),
    steps: z.array(z.string()),
    expected_result: z.string(),
    priority: z.string()
});

export const TestCase = z.object({
  name: z.string(),
  description: z.string(),
  prerequisites: z.array(z.string()),
  steps: z.array(z.string()),
  expected_result: z.string(),
  priority: z.string()
});

export const GenerateResponse = z.object({
    codebase_summary: z.string(),
    pr_changes: z.string(),
    tests: TestCase.array(),
    setup_instructions: z.string().optional()
});


export const ImportantFile = z.object({
  path: z.string(),
  reason: z.string()
});

export const FileAnalysisResponse = z.object({
  files: ImportantFile.array()
});

export const TestResult = z.object({
  test_number: z.number(),
  test_name: z.string(),
  steps: TimestampedStep.array().optional(),
  success: z.boolean(),
  error: z.string().optional(),
  notes: z.string().optional()
});

export const SetupSchema = z.object({
  setup_success: z.boolean(),
  setup_error: z.string().optional()
});

export const VibePRStep = z.object({
  type: z.enum(["bash", "create-env", "instruction", "wait"]),
  command: z.string().optional(),
  text: z.string().optional(),
  seconds: z.number().optional()
});

export const VibePRConfig = z.object({
  steps: VibePRStep.array()
});

export const ReviewPhase = z.object({
  status: z.enum(["pending", "in_progress", "complete", "failed"]),
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
  error: z.string().optional()
});

export const GeneratePhase = z.object({
  codebase_summary: z.string().optional(),
  pr_changes_summary: z.string().optional(),
  generated_tests: TestCase.array().optional(),
  auto_setup_instructions: z.string().optional(),
  vibePR_yaml_content: z.string().optional()
});

export const SetupPhase = z.object({
  steps: TimestampedStep.array().optional()
});

export const ExecutePhase = z.object({
  test_results: TestResult.array().optional()
});





// export const PullRequest = z.object({
//   number: z.number(),
//   title: z.string(),
//   body: z.string().optional(),
//   head: {
//     ref: z.string(),
//     sha: z.string(),
//     repo: {
//       full_name: z.string(),
//     },
//   }
// });

// export const UbuntuInstance = z.object({
//   id: z.string(),

// });

// export interface ScrapybaraClient {
//   start_ubuntu: () => UbuntuInstance;
//   act: (options: {
//     model: any;
//     tools: any[];
//     system: string;
//     prompt: string;
//     schema?: any;
//     on_step?: (step: any) => void;
//   }) => Promise<{ output: any }>;
// }

export const ReqSchema = z.object({
  provider: z.enum(["groq", "perplexity-ai", "google-ai-studio", "workers-ai"]),
  modelId: z.enum([
    "gemini-2.5-flash", 
    "gemini-2.5-pro", 
    "gemini-1.0-pro",
    "llama-3.1-8b-instant", 
    "llama-3.1-70b-versatile", 
    "deepseek-r1-distill-llama-70b",
    "qwen/qwen3-32b",
    "moonshotai/kimi-k2-instruct",
    "mistral-7b-instruct",
    "@cf/meta/llama-3.1-8b-instant",
    "sonar",
  ]),
  prompt: z.string(),
  systemPrompt: z.string().optional(),
  type: z.enum(["execute", "generate"]),
});

export const Repo = z.object({
  id: z.number(),
  ownerGithubId: z.number(),
  installationId: z.number(),
  name: z.string(),
  owner: z.string(),
  ownerAvatarUrl: z.string(),
  url: z.string(),
  isPrivate: z.boolean(),
  connected: z.boolean(),
  updatedAt: z.string(),
});

export const GitHubFile = z.object({
  filename: z.string(),
  patch: z.string().optional(),
  status: z.string(),     // // "added", "removed", "modified", "renamed"
  additions: z.number(),
  deletions: z.number(),
  changes: z.number(),
});

export const PullRequest = z.object({
  number: z.number(),
  title: z.string(),
  body: z.string().optional(),
  head: z.object({
    ref: z.string(),
    sha: z.string(),
    repo: z.object({
      fullName: z.string(),
    }),
  }),
});

export const Review = z.object({
  id: z.string().optional(),
  repoId: z.number(),
  prNumber: z.number(),
  commitSha: z.string(),
  instanceId: z.string().optional(),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  status: z.enum(["pending", "in_progress", "complete", "failed"]),
  totalTests: z.number().optional(),
  passedTests: z.number().optional(),
  generate: GeneratePhase.optional(),
  setup: SetupPhase.optional(),
  execute: ExecutePhase.optional(),
});

