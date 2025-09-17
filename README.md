# Repository-Context-Packager （repomaster）
**RepoMaster** is a CLI tool that analyzes local git repositories and creates a text file containing repository content optimized for sharing with LLMs.

Instead of copy-pasting code file by file, RepoMaster automatically collects:

- Repository location
- Git commit info
- Project directory tree
- File contents (with headers & truncation for large files)
- Summary statistics (total files and total lines)

## Installation

Clone the repository and install globally with `npm`:

```bash
git clone https://github.com/AubreyDDD/Repository-Context-Packager.git
cd Repository-Context-Packager
npm install
npm link
```

## Usage
```bash
# Package the current directory
repomaster .

# Package a specific repo directory
repomaster /path/to/my-project

# Package specific files
repomaster src/cli.js bin/repomaster.js

# Package with output file
repomaster . -o output.txt
repomaster . --output output.md

# Show version
repomaster -V
repomaster --version

# Show help
repomaster -h
repomaster --help
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

import { Command } from 'commander';


## Summary
- Total files: 11
- Total lines: 619
```
