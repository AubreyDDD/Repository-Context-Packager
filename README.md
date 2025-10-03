# Repository-Context-Packager （repomaster）
**RepoMaster** is a CLI tool that analyzes local git repositories and creates a text file containing repository content optimized for sharing with LLMs.

Instead of copy-pasting code file by file, RepoMaster automatically collects:

- Repository location
- Git commit info
- Project directory tree
- File contents (with headers & truncation for large files)
- Summary statistics (total files and total lines)

## Features

- **Gitignore Integration**: Automatically exclude files and directories listed in .gitignore
- **Flexible Output**: Output to stdout or save to a file (.txt, .md, or any extension)
- **Smart File Handling**: Automatically detects and skips binary files
- **Customizable Scope**: Process entire directories or specific files
- **Line Numbers**: Optional line numbers display for easier code reference
- **Content Search**: Filter files by content using regex patterns with `--grep`
- **Configuration File**: Making some optional features by default
  You can modify the `.repomaster-config.toml` file in your repository to set default options:

  ```toml
  # Output file path - where to write the repository context
  output = 'output.txt'

  # Include all files, ignore .gitignore rules
  noGitIgnore = false

  # Include line numbers in file content output
  lineNumbers = true

  # List recent modified files (within last 5 days) only
  recent = 5

  # Include line numbers in file content output
  grep = 'repomaster'
  ```
  - If the config file doesn't exist, it will be ignored
  - Command line arguments override config file settings
  - Invalid TOML files will cause the tool to exit with an error
  - Unrecognized options are ignored for future extensibility

## Installation

Clone the repository and install globally with `npm`:

```bash
git clone https://github.com/AubreyDDD/Repository-Context-Packager.git
cd Repository-Context-Packager
npm install
npm link
```

## Example Usage
```bash
# Package the current directory, Use .gitignore and `-o output.txt` by default (exclude ignored files)
repomaster .

# Include all files, ignore .gitignore rules  
repomaster . --no-gitignore

# Package a specific repo directory
repomaster /path/to/my-project

# Package specific files
repomaster src/cli.js bin/repomaster.js

# Package with output file
repomaster . -o output.txt
repomaster . --output output.md

# Combine multiple options
repomaster . --no-gitignore -o output.md

# Show version
repomaster -V
repomaster --version

# Show help
repomaster -h
repomaster --help

# list recent modified files (within last 7 days) only
repomaster . -r
repomaster . --recent

# list recent modified files (within last N days) only
repomaster . -r 14
repomaster . --recent 30

# Include line numbers in file content output
repomaster . -l
repomaster . --line-numbers

# Filter files by content pattern (case-insensitive regex search)
repomaster . --grep "Command"
repomaster . --grep "import.*React"
```

## Example Output

```bash
# Repository Context

## File System Location
/Users/username/Desktop/my-project

## Git Info
- Commit: e45f8911e2ca40223faf2309bf1996443f2df336
- Branch: main
- Author: Aubrey Du <aubrey@example.com>
- Date: Thu Sep 12 16:07:19 2025 -0400

## Structure
bin/
  repomaster.js
src/
  cli.js
  git.js
  io.js
  tree.js
  walk.js
.gitignore
LICENSE
package-lock.json
package.json

## File Contents

### File: src/cli.js

```javascript
1: import { Command } from 'commander';
2: import fs from 'node:fs';
3: import path from 'node:path';
4: // ... more code ...

## Summary
- Total files: 11
- Total lines: 619
```

## Contributors

<a href="https://github.com/whyang9701">
  <img src="https://github.com/whyang9701.png" width="50" height="50" style="border-radius:50%;" />
</a>
