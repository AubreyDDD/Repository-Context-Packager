// src/git.js
import { execFileSync } from 'node:child_process';

// Function to get Git information (commit, branch, author, date) for a given directory
export function getGitInfoOrNull(baseDir) {
  try {
    const run = (args) => execFileSync('git', args, { cwd: baseDir }).toString().trim();
    const commit = run(['rev-parse', 'HEAD']);
    const branch = run(['rev-parse', '--abbrev-ref', 'HEAD']);
    const authorName  = run(['show', '-s', '--format=%an', 'HEAD']);
    const authorEmail = run(['show', '-s', '--format=%ae', 'HEAD']);
    const date        = run(['show', '-s', '--format=%cd', 'HEAD']);
    return { commit, branch, author: `${authorName} <${authorEmail}>`, date };
  } catch {
    return null; 
  }
}