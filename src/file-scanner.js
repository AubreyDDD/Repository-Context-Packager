import fs from 'node:fs';     
import path from 'node:path'; 
import { globbySync } from 'globby';

/**
 * Collect files from given paths using globby
 * If a path is a file, it adds that file; if it's a directory, it explores all files inside
 * @param {string[]} absInputs - Array of absolute paths (files or directories)
 * @param {boolean} useGitignore - Whether to respect .gitignore rules
 * @returns {string[]} - Array of absolute file paths, sorted alphabetically
 */
export function collectFiles(absInputs, useGitignore = true) {
  if (!absInputs || absInputs.length === 0) {
    return [];
  }

  // Determine the working directory (use the first input's directory)
  let cwd;
  try {
    const firstStat = fs.statSync(absInputs[0]);
    cwd = firstStat.isDirectory() ? absInputs[0] : path.dirname(absInputs[0]);
  } catch (e) {
    console.error(`[skip] Cannot access: ${absInputs[0]} — ${e.message}`);
    return [];
  }

  const patterns = [];
  
  // Convert each input path to a glob pattern relative to cwd
  for (const input of absInputs) {
    try {
      const stat = fs.statSync(input);
      
      if (stat.isDirectory()) {
        // For directories, add pattern for all files recursively
        const relDir = path.relative(cwd, input);
        patterns.push(relDir ? path.join(relDir, '**/*') : '**/*');
      } else if (stat.isFile()) {
        // For files, add relative path
        patterns.push(path.relative(cwd, input));
      }
    } catch (e) {
      // If we can't access the path, show an error and skip it
      console.error(`[skip] Cannot access: ${input} — ${e.message}`);
      continue;
    }
  }

  if (patterns.length === 0) {
    return [];
  }

  try {
    // Use globby to find all matching files
    const options = {
      cwd: cwd,                     // Set working directory for .gitignore lookup
      dot: true,                    // Include dotfiles
      absolute: true,               // Return absolute paths
      onlyFiles: true,              // Only return files, not directories
      followSymbolicLinks: false    // Don't follow symbolic links
    };

    if (useGitignore) {
      // When using gitignore, respect .gitignore rules but always ignore .git
      options.gitignore = true;
      options.ignore = ['**/.git/**'];
    } else {
      // When not using gitignore, don't apply any ignore patterns (user wants all files)
      // Still ignore .git directory as it's never useful for code context
      options.ignore = ['**/.git/**'];
    }

    const files = globbySync(patterns, options);

    // Sort files alphabetically to make the output organized
    return files.sort((a, b) => a.localeCompare(b));
  } catch (e) {
    console.error(`[error] Failed to collect files: ${e.message}`);
    return [];
  }
}