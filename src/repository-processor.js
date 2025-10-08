import fs from 'node:fs';
import path from 'node:path';
import { getGitInfoOrNull } from './git-info.js';
import { collectFiles } from './file-scanner.js';
import { buildTree, renderTree } from './tree-builder.js';
import { readFilesAndSummarize, isLikelyBinary } from './content-handler.js';
import { isBooleanObject } from 'node:util/types';

/**
 * Process and validate input paths, return base directory
 */
function processInputPaths(paths) {
  const absPaths = paths.map(p => path.resolve(p));
  
  try {   
    const fileStats = fs.statSync(absPaths[0]);
    // if directory, use it; if file, use its parent dir
    const baseDir = fileStats.isDirectory() ? absPaths[0] : path.dirname(absPaths[0]);
    return { absPaths, baseDir };
  } catch {
    console.error(`Error: Path does not exist - ${absPaths[0]}`);
    process.exit(1);
  }
}

/**
 * Get and format Git information
 */
function getFormattedGitInfo(baseDir) {
  const git = getGitInfoOrNull(baseDir);
  
  return git
    ? [
        `- Commit: ${git.commit}`,
        `- Branch: ${git.branch}`,
        `- Author: ${git.author}`,
        `- Date: ${git.date}`
      ].join('\n')
    : '- Not a git repository';
}

/**
 * Generic file filter function with error handling
 */
function createFileFilter(name, condition, filterFn) {
  return function(filesAbs) {
    if (!condition) return filesAbs;
    
    return filesAbs.filter(filePath => {
      try {
        return filterFn(filePath);
      } catch (e) {
        console.error(`[skip] Cannot process for ${name}: ${filePath} — ${e.message}`);
        return false;
      }
    });
  };
}

/**
 * Filter files by recent modification time
 */
function filterRecentFiles(filesAbs, recentOption) {
  const days = isBooleanObject(recentOption) ? 7 : parseInt(recentOption, 10) || 7;
  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
  
  const filter = createFileFilter('recent files', recentOption, (filePath) => {
    const fileStats = fs.statSync(filePath);
    const modifiedTime = fileStats.mtimeMs || fileStats.ctimeMs || 0;
    return modifiedTime > cutoffTime;
  });
  
  return filter(filesAbs);
}

/**
 * Filter files by content pattern (grep)
 */
function filterFilesByContent(filesAbs, grepPattern) {
  const pattern = grepPattern ? new RegExp(grepPattern, 'i') : null;
  
  const filter = createFileFilter('content search', grepPattern, (filePath) => {
    const fileBuffer = fs.readFileSync(filePath);
    // Skip binary files for content search
    if (isLikelyBinary(fileBuffer)) {
      return false;
    }
    const content = fileBuffer.toString('utf8');
    return pattern.test(content);
  });
  
  return filter(filesAbs);
}

/**
 * Filter files to valid relative paths
 */
function filterValidRelativePaths(filesAbs, baseDir) {
  return filesAbs.filter(filePath => {
    const relativePath = path.relative(baseDir, filePath);
    return relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
  });
}

/**
 * Apply all file filters in a chain
 */
function applyFileFilters(filesAbs, options) {
  const filters = [
    // Recent files filter
    (files) => filterRecentFiles(files, options.recent),
    // Content pattern filter  
    (files) => filterFilesByContent(files, options.grep)
  ];
  
  return filters.reduce((files, filter) => filter(files), filesAbs);
}

/**
 * Generate the complete output content
 */
function generateOutput(baseDir, gitSection, filesAbs, options) {
  // Filter files to valid relative paths for tree generation
  const validFiles = filterValidRelativePaths(filesAbs, baseDir);
  
  // Generate directory tree
  const filesRel = validFiles.map(f => path.relative(baseDir, f));
  const treeText = filesRel.length
    ? renderTree(buildTree(filesRel))
    : '(empty)';

  // Read files and summarize (use original filesAbs for content processing)
  const { sections, stats } = readFilesAndSummarize(filesAbs, baseDir, options.lineNumbers);

  // Build output template
  return [
    '# Repository Context',
    '',
    '## File System Location',
    baseDir,
    '',
    '## Git Info',
    gitSection,
    '',
    '## Structure',
    '```',
    treeText,
    '```',
    '',
    '## File Contents',
    sections.join('\n'),
    '',
    '## Summary',
    `- Total files: ${stats.totalTextFiles}`,
    `- Total lines: ${stats.totalLines}`,
    ''
  ].join('\n');
}

/**
 * Write output to file or stdout
 */
function writeOutput(content, outputPath) {
  if (outputPath) {
    try {
      fs.writeFileSync(outputPath, content, 'utf8');
      console.log(`Output written to: ${outputPath}`);
    } catch (error) {
      console.error(`Error writing to file ${outputPath}: ${error.message}`);
      process.exit(1);
    }
  } else {
    process.stdout.write(content);
  }
}

/**
 * Main repository processing function
 * Orchestrates the entire repository analysis and output generation process
 */
export function processRepository(paths, options) {
  // 1. Process and validate input paths
  const { absPaths, baseDir } = processInputPaths(paths);
  
  // 2. Get Git information
  const gitSection = getFormattedGitInfo(baseDir);
  
  // 3. Collect files from the specified paths
  let filesAbs = collectFiles(absPaths, options.gitignore);
  
  // 4. Check if any files were found
  if (filesAbs.length === 0) {
    console.error('No valid files found');
    process.exit(1);
  }
  
  // 5. Apply filters (recent, grep, etc.)
  filesAbs = applyFileFilters(filesAbs, options);
  
  // 6. Generate the complete output content
  const output = generateOutput(baseDir, gitSection, filesAbs, options);
  
  // 7. Write output to file or stdout
  writeOutput(output, options.output);
}
