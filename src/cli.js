import { Command } from 'commander';
import fs from 'node:fs'; 
import path from 'node:path';


import { getGitInfoOrNull } from './git.js';
import { collectFiles } from './walk.js';
import { buildTree, renderTree } from './tree.js';
import { readFilesAndSummarize } from './io.js';

const program = new Command();


program
  .name('repomaster')
  .description('Repository Context Packager - package repo context for LLMs')
  .version('0.1.0')   // --version / -V
  .argument('<paths...>', 'one or more files/directories (use . for current)') // receive 1+ paths
  .option('-o, --output <file>', 'output to a file instead of stdout')
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
    
    
    const filesAbs = collectFiles(absPaths);
    
    // If no valid files were found, exit with error
    if (filesAbs.length === 0) {
      // Error messages have already been printed by collectFiles
      process.exit(1);
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


