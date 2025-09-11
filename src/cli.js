import { Command } from 'commander';
import fs from 'node:fs'; // check exists, read files
import path from 'node:path'; // convert to absolute
import { execFileSync } from 'node:child_process'; // git commands

const program = new Command();

program
  .name('repomaster')
  .description('Repository Context Packager - package repo context for LLMs')
  .version('0.1.0')   // --version / -V
  .argument('<paths...>', 'one or more files/directories (use . for current)') // receive 1+ paths
  .action((paths) => {
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
        //baseDir = process.cwd();
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
      '',
      '```',
      '',
      '## File Contents',
      '',
      '',
      '## Summary',
      '- Total files: ',
      '- Total lines: ',
      ''
    ].join('\n');

    process.stdout.write(out);
  });

 // async parse to allow for future async actions
program.parseAsync(process.argv);

/* -------- helpers -------- */

// get git info
function getGitInfoOrNull(baseDir) {
  try {
    const run = (args) => execFileSync('git', args, { cwd: baseDir }).toString().trim();

    const commit = run(['rev-parse', 'HEAD']);
    const branch = run(['rev-parse', '--abbrev-ref', 'HEAD']);
    const authorName  = run(['show', '-s', '--format=%an', 'HEAD']);
    const authorEmail = run(['show', '-s', '--format=%ae', 'HEAD']);
    const date   = run(['show', '-s', '--format=%cd', 'HEAD']);

   const author = `${authorName} <${authorEmail}>`;
    return { commit, branch, author, date };
  } catch {
    return null; 
  }
}


