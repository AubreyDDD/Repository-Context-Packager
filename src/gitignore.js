import fs from 'node:fs';
import path from 'node:path';
import ignore from 'ignore';

/**
 * Load and parse .gitignore file from a directory
 * @param {string} dir - The directory to look for .gitignore
 * @returns {Object|null} - An ignore instance or null if no .gitignore found
 */
export function loadGitignore(dir) {
  const gitignorePath = path.join(dir, '.gitignore');
  
  try {
    // Check if .gitignore exists
    if (!fs.existsSync(gitignorePath)) {
      return null;
    }
    
    // Read .gitignore content
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    
    // Create ignore instance and add rules
    const ig = ignore().add(gitignoreContent);
    
    // Always ignore .git directory (even if not in .gitignore)
    ig.add('.git');
    
    return ig;
  } catch (error) {
    console.error(`Warning: Could not read .gitignore: ${error.message}`);
    return null;
  }
}

/**
 * Find the nearest .gitignore file by traversing up the directory tree
 * @param {string} startDir - The directory to start searching from
 * @returns {Object|null} - An ignore instance or null if no .gitignore found
 */
export function findNearestGitignore(startDir) {
  let currentDir = startDir;
  const root = path.parse(currentDir).root;
  
  while (currentDir !== root) {
    const ig = loadGitignore(currentDir);
    if (ig) {
      return { ig, gitignoreDir: currentDir };
    }
    
    // Check if we've reached a .git directory (repository root)
    const gitDir = path.join(currentDir, '.git');
    if (fs.existsSync(gitDir) && fs.statSync(gitDir).isDirectory()) {
      // We've reached a git repository root without finding .gitignore
      return null;
    }
    
    // Move up one directory
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

/**
 * Check if a file should be ignored based on gitignore rules
 * @param {string} filePath - Absolute path to the file
 * @param {Object} ig - The ignore instance
 * @param {string} gitignoreDir - Directory containing the .gitignore file
 * @returns {boolean} - True if the file should be ignored
 */
export function shouldIgnore(filePath, ig, gitignoreDir) {
  if (!ig) return false;
  
  // Get relative path from gitignore directory
  let relativePath = path.relative(gitignoreDir, filePath);
  
  // If the path is the gitignore directory itself, return false
  if (!relativePath) {
    return false;
  }
  
  // ignore library expects forward slashes
  const normalizedPath = relativePath.split(path.sep).join('/');
  
  return ig.ignores(normalizedPath);
}
