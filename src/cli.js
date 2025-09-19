import { Command } from 'commander';
import fs, { fstatSync } from 'node:fs'; 
import path from 'node:path';
import { getGitInfoOrNull } from './git-info.js';
import { collectFiles } from './file-scanner.js';
import { buildTree, renderTree } from './tree-builder.js';
import { readFilesAndSummarize } from './content-handler.js';
import { isBooleanObject } from 'node:util/types';

const program = new Command();

program
  .name('repomaster')
  .description('Repository Context Packager - package repo context for LLMs')
  .version('0.1.0')   // --version / -V
  .argument('<paths...>', 'one or more files/directories (use . for current)') // receive 1+ paths
  .option('-o, --output <file>', 'output to a file instead of stdout')
  .option('--no-gitignore', 'do not use .gitignore rules (include all files)')
  .option('-r, --recent [days]', 'only include the most recently (7 days) modified files per directory')
  .action((paths, options) => {
    // convert to absolute paths
    const absPaths = paths.map(p => path.resolve(p));

    // get base directory
    let baseDir;
      try {   
        const st = fs.statSync(absPaths[0]);
        // if directory, use it; if file, use its parent dir
        baseDir = st.isDirectory() ? absPaths[0] : path.dirname(absPaths[0]);
      } catch {
        console.error(`Error: Path does not exist - ${absPaths[0]}`);
        process.exit(1);  // Exit with error code 1 when path doesn't exist
      }

      // get git info if possible
      const git = getGitInfoOrNull(baseDir);
      
      const gitSection = git
        ? [
            `- Commit: ${git.commit}`,
            `- Branch: ${git.branch}`,
            `- Author: ${git.author}`,
            `- Date: ${git.date}`
          ].join('\n')
        : '- Not a git repository';
    
    
    let filesAbs = collectFiles(absPaths, options.gitignore);
    
    // If no valid files were found, exit with error
    if (filesAbs.length === 0) {
      // Error messages have already been printed by collectFiles
      process.exit(1);
    }
      // filter by recent if specified
      if(options.recent){
        options.recent = isBooleanObject(options.recent) ? 7 : parseInt(options.recent,10) || 7; // default to 7 days if no number provided
        filesAbs = filesAbs.filter(filePath=>{
          const fstat = fs.statSync(filePath);
          fstat.mtimeMs = fstat.mtimeMs || fstat.ctimeMs || 0; // fallback to ctime if mtime is unavailable
          return fstat.mtimeMs > Date.now() - options.recent * 24 * 60 * 60 * 1000;
        });
      }

       // get directory tree text
      const filesRel = filesAbs
        .map(f => path.relative(baseDir, f))
        .filter(rel => rel && !rel.startsWith('..') && !path.isAbsolute(rel));
      const treeText = filesRel.length
        ? renderTree(buildTree(filesRel))
        : '(empty)';

     // read files and summarize
      const { sections, stats } = readFilesAndSummarize(filesAbs, baseDir);

    // basic output template
    const out = [
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

    // Output to file or stdout based on options
    if (options.output) {
      try {
        fs.writeFileSync(options.output, out, 'utf8');
        console.log(`Output written to: ${options.output}`);
      } catch (error) {
        console.error(`Error writing to file ${options.output}: ${error.message}`);
        process.exit(1);
      }
    } else {
      process.stdout.write(out);
    }
  });

 // async parse to allow for future async actions
program.parseAsync(process.argv);


