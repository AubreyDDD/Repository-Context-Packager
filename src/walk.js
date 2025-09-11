import fs from 'node:fs';     
import path from 'node:path'; 

// skip .git and node_modules directories
const DEFAULT_EXCLUDED_DIRS = new Set(['.git', 'node_modules']);


// If a path is a file, it adds that file; if it's a directory, it explores all files inside
export function collectFiles(absInputs) {
  const out = [];       
  const seen = new Set(); 

  // Go through each input path the user provided
  for (const p of absInputs) {
    let st; 
    try {
      // Try to get information about this path
      st = fs.statSync(p);
    } catch (e) {
      // If we can't access the path, show an error and skip it
      console.error(`[skip] Cannot access: ${p} — ${e.message}`);
      continue;
    }
    
    if (st.isDirectory()) {
      // If it's a directory, explore all files inside it recursively
      walkDir(p, out, seen);
    } else if (st.isFile()) {
      // If it's a file and we haven't seen it before, add it to our list
      if (!seen.has(p)) { out.push(p); seen.add(p); }
    }
  }

  // Sort all files alphabetically to make the output organized
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

// explore a directory and all its subdirectories recursively
function walkDir(dir, out, seen) {
  let entries;  
  try {
    // Try to read all files and folders in this directory
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    // If we can't read the directory, show an error and skip it
    console.error(`[skip] Cannot read dir: ${dir} — ${e.message}`);
    return;
  }

  // Go through each item (file or folder) in this directory
  for (const ent of entries) {
    const name = ent.name;                   
    const full = path.join(dir, name);       

    // Skip certain directories that we don't want to include
    // .git contains Git's internal files, node_modules contains downloaded libraries
    if (ent.isDirectory?.() && DEFAULT_EXCLUDED_DIRS.has(name)) {
      continue;  // Skip this directory and move to the next item
    }

    try {
      if (ent.isDirectory?.()) {
        // If this item is a directory, explore it recursively (call this function again)
        walkDir(full, out, seen);
      } else if (ent.isFile?.()) {
        // If this item is a file and we haven't seen it before, add it to our list
        if (!seen.has(full)) { out.push(full); seen.add(full); }
      } else {
        // Handle special cases like symbolic links (shortcuts to other files/folders)
        const st = fs.statSync(full);  // Get more detailed information about this item
        if (st.isDirectory()) {
          // If it's actually a directory, explore it
          walkDir(full, out, seen);
        } else if (st.isFile()) {
          // If it's actually a file, add it to our list
          if (!seen.has(full)) { out.push(full); seen.add(full); }
        }
      }
    } catch (e) {
      // If we can't access this item, show an error and continue with the next item
      console.error(`[skip] Cannot stat: ${full} — ${e.message}`);
      continue;
    }
  }
}