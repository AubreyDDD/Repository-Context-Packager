import { Command } from 'commander';

const program = new Command();

program
  .name('repomaster')
  .description('Repository Context Packager - package repo context for LLMs')
  .version('0.1.0')   // --version / -V
  .argument('<paths...>', 'one or more files/directories (use . for current)') // receive 1+ paths
  .action((paths) => {
    console.error('[repomaster] received paths:', paths);
    
    // basic output template
    const out = [
      '# Repository Context',
      '',
      '## File System Location',
      process.cwd(),
      '',
      '## Git Info',
      '',
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