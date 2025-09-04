import { boolean, integer, json, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const repositories = pgTable('repositories', {
  id: serial('id').primaryKey(),
  owner: text('owner'),
  installation_id: text('installation_id'),
  owner_github_id: text('owner_github_id'),
  owner_avatar_url: text('owner_avatar_url'),
  url: text('url'),
  is_private: boolean('is_private'),
  connected: boolean('connected'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const reviews = pgTable('reviews', {
    id: text('id').primaryKey(),
    repoId: integer('repo_id').notNull(),
    prNumber: integer('pr_number').notNull(),
    commitSha: text('commit_sha').notNull(),
    instanceId: text('instance_id'),
    startedAt: text('started_at').notNull(),
    completedAt: text('completed_at'),
    status: text('status').notNull().$type<'pending' | 'in_progress' | 'complete' | 'failed'>(),
    totalTests: integer('total_tests'),
    passedTests: integer('passed_tests'),
    generate: json('generate').$type<GeneratePhase>().notNull(),
    setup: json('setup').$type<SetupPhase>().notNull(),
    execute: json('execute').$type<ExecutePhase>().notNull(),
    updatedAt: text('updated_at').notNull(),
});

export interface ReviewPhase {
    status: 'pending' | 'in_progress' | 'complete' | 'failed';
    startedAt?: string;
    completedAt?: string;
    error?: string;
}

export interface GeneratePhase extends ReviewPhase {
    codebaseSummary?: string;
    prChangesSummary?: string;
    generatedTests?: TestCase[];
    autoSetupInstructions?: string;
    capyYamlContent?: string;
  }

export interface TestCase {
    name: string;
    description: string;
    prerequisites: string[];
    steps: string[];
    expectedResult: string;
    priority: 'low' | 'medium' | 'high';
  }
  
export interface TimestampedStep {
    text: string;
    timestamp: string;
    screenshot?: string;
    action?: string;
}

export interface SetupPhase extends ReviewPhase {
    steps?: TimestampedStep[];  
}

export interface TestResult {
    testNumber: number;
    testName: string;
    success: boolean;
    error?: string;
    notes?: string;
    steps?: TimestampedStep[];
}

export interface ExecutePhase extends ReviewPhase {
testResults?: TestResult[];
}

