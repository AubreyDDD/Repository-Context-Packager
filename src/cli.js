import { Command, Option } from 'commander';
import { loadTomlConfig } from './toml-config.js';
import { processRepository } from './repository-processor.js';

// Load configuration from TOML file
const tomlConfig = loadTomlConfig();

const program = new Command();

program
  .name('repomaster')
  .description('Repository Context Packager - package repo context for LLMs')
  .version('0.1.0')   // --version / -V
  .argument('<paths...>', 'one or more files/directories (use . for current)') // receive 1+ paths
  .addOption(new Option('-o, --output <file>', 'output to a file instead of stdout').default(tomlConfig.output))
  .addOption(new Option('--no-gitignore', 'do not use .gitignore rules (include all files)').default(tomlConfig.noGitIgnore))
  .addOption(new Option('-r, --recent [days]', 'only include the most recently (7 days) modified files per directory. \n-r(default 7days), -r [days] could show custom days').default(tomlConfig.recent))
  .addOption(new Option('-l, --line-numbers', 'include line numbers in file content output').default(tomlConfig.lineNumbers))
  .addOption(new Option('--grep <pattern>', 'only include files containing the specified pattern').default(tomlConfig.grep))
  .action((paths, options) => {
    processRepository(paths, options);
  });

 // async parse to allow for future async actions
program.parseAsync(process.argv);


