import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import crypto from 'crypto';
import config from './config';

const auth = createAppAuth({
    appId: config.github.appId,
    privateKey: config.github.privateKey,
  });
  
export function createOctokit(installationId?: number) {
    return new Octokit({
        authStrategy: createAppAuth,
        auth: {
        appId: config.github.appId,
        privateKey: config.github.privateKey,
        installationId,
        },
    });
}
  
export function getGithubIntegration() {
    return {
      appId: config.github.appId,
      privateKey: config.github.privateKey,
      auth,
    };
}
  
export async function getInstallation(installationId: number) {
    const octokit = createOctokit();
    const { data: installation } = await octokit.apps.getInstallation({
      installation_id: installationId,
    });
    return installation;
}
  
  export async function getInstallationAccessToken(installationId: number): Promise<string> {
    const { token } = await auth({
      type: 'installation',
      installationId,
    });
    return token;
  }
  
export function verifyGithubWebhook(signature: string, payload: string): boolean {
    const hmac = crypto.createHmac('sha256', config.github.webhookSecret);
    hmac.update(payload, 'utf8');
    const expectedSignature = `sha256=${hmac.digest('hex')}`;
  
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }
  
export async function addPrComment(
    octokit: Octokit,
    owner: string,
    repo: string,
    prNumber: number,
    commentText: string
  ): Promise<number | null> {
    try {
      const { data } = await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: commentText,
      });
      return data.id;
    } catch (error) {
      console.error(`Error adding comment to PR: ${error}`);
      return null;
    }
  }
  
export async function editPrComment(
    octokit: Octokit,
    owner: string,
    repo: string,
    commentId: number,
    newComment: string
  ): Promise<boolean> {
    try {
      await octokit.issues.updateComment({
        owner,
        repo,
        comment_id: commentId,
        body: newComment,
      });
      return true;
    } catch (error) {
      console.error(`Error editing PR comment: ${error}`);
      return false;
    }
  }
  
export async function getTreeContent(
    octokit: Octokit,
    owner: string,
    repo: string,
    path: string = '',
    level: number = 0,
    maxLevel: number = 3
  ): Promise<string> {
    try {
      const { data: contents } = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });
  
      const items = Array.isArray(contents) ? contents : [contents];
      const tree: string[] = [];
  
      for (const item of items) {
        if (item.type === 'dir') {
          if (
            level < maxLevel &&
            !['.git', 'node_modules', '__pycache__', '.venv'].some(ignore =>
              item.path.startsWith(ignore)
            )
          ) {
            const subtree = await getTreeContent(octokit, owner, repo, item.path, level + 1, maxLevel);
            if (subtree) {
              tree.push(`${'  '.repeat(level)}📁 ${item.name}/\n${subtree}`);
            }
          }
        } else {
          if (
            !item.name.startsWith('.') &&
            !item.name.endsWith('.pyc') &&
            !item.name.endsWith('.pyo')
          ) {
            tree.push(`${'  '.repeat(level)}📄 ${item.name}`);
          }
        }
      }
  
      return tree.join('\n');
    } catch (error) {
      return `Error getting tree for ${path}: ${error}`;
    }
  }
  
export async function getPullRequest(
    octokit: Octokit,
    owner: string,
    repo: string,
    prNumber: number
  ) {
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });
    return pr;
  }
  
export async function getPrFiles(
    octokit: Octokit,
    owner: string,
    repo: string,
    prNumber: number
  ) {
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
    });
    return files;
  }
  
export async function getFileContent(
    octokit: Octokit,
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string | null> {
    try {
      const { data: file } = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });
  
      if ('content' in file && file.encoding === 'base64') {
        return Buffer.from(file.content, 'base64').toString('utf-8');
      }
  
      return null;
    } catch (error) {
      console.error(`Error getting file content for ${path}: ${error}`);
      return null;
    }
  }
  
export async function getRepoVariables(
    octokit: Octokit,
    owner: string,
    repo: string
  ) {
    try {
      const { data: variables } = await octokit.actions.listRepoVariables({
        owner,
        repo,
      });
      return variables.variables || [];
    } catch (error) {
      console.error(`Error getting repo variables: ${error}`);
      return [];
    }
  }
  
  export default {
    createOctokit,
    getGithubIntegration,
    getInstallation,
    getInstallationAccessToken,
    verifyGithubWebhook,
    addPrComment,
    editPrComment,
    getTreeContent,
    getPullRequest,
    getPrFiles,
    getFileContent,
    getRepoVariables,
  };
  