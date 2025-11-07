import { execFileSync } from 'node:child_process';

// Function to get Git information (commit, branch, author, date) for a given directory
export function getGitInfoOrNull(baseDir) {
  try {
    // Get all git info in a single call using a custom format
    const gitInfo = execFileSync('git', ['log', '-1', '--pretty=format:%H|%D|%an|%ae|%cd'], {
      cwd: baseDir,
    })
      .toString()
      .trim();

    const [commit, refInfo, authorName, authorEmail, date] = gitInfo.split('|');

    // Extract branch name from ref info
    // If it's a detached HEAD, refInfo might just be "HEAD" or empty
    let branch = 'HEAD'; // default fallback
    if (refInfo && refInfo.includes('->')) {
      const branchMatch = refInfo.match(/HEAD -> ([^,]+)/);
      if (branchMatch) {
        branch = branchMatch[1].trim();
      }
    } else if (refInfo && !refInfo.includes('HEAD')) {
      // If no "HEAD ->" but has branch info, try to extract first branch
      const firstRef = refInfo.split(',')[0].trim();
      if (firstRef && !firstRef.startsWith('tag:')) {
        branch = firstRef.replace(/^origin\//, '');
      }
    }

    // If we still don't have a proper branch name, fall back to git rev-parse
    if (branch === 'HEAD' || !branch) {
      try {
        branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: baseDir })
          .toString()
          .trim();
      } catch {
        branch = 'HEAD';
      }
    }

    return {
      commit,
      branch,
      author: `${authorName} <${authorEmail}>`,
      date,
    };
  } catch {
    return null;
  }
}
