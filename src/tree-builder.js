// Function that takes a list of file paths and builds a tree structure

export function buildTree(relFilePaths) {
  const root = {}; // Start with an empty root object to build our tree

  // Process each file path to build the tree structure
  for (const rel of relFilePaths) {
    // Split the path into parts (folders and filename)
    const parts = rel.split(/[\\/]/).filter(Boolean); // Split on slash or backslash, remove empty parts

    let node = root; // Start at the root of our tree

    // Go through each part of the path
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLeafFile = i === parts.length - 1;

      if (isLeafFile) {
        // If this is a file (last part), mark it as null (files don't have children)
        if (!Object.prototype.hasOwnProperty.call(node, name)) node[name] = null;
      } else {
        // If this is a folder, create an empty object for it (folders can have children)
        if (!Object.prototype.hasOwnProperty.call(node, name)) node[name] = {};
        node = node[name]; // Move into this folder for the next iteration
      }
    }
  }
  return root;
}

// Function that converts the tree structure into a visual text representation
// Takes the tree object and turns it into text that looks like a file explorer
export function renderTree(node, indent = '') {
  const lines = []; // Array to store each line of our visual tree

  // Get all entries (files and folders) and sort them nicely
  // Directories come first, then files, and within each group they're alphabetically sorted
  const entries = Object.entries(node).sort(([aName, aVal], [bName, bVal]) => {
    const aIsDir = aVal !== null,
      bIsDir = bVal !== null;
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    return aName.localeCompare(bName);
  });

  // Process each file or folder
  for (const [name, child] of entries) {
    if (child === null) {
      // If child is null, this is a file - just add its name with current indentation
      lines.push(`${indent}${name}`);
    } else {
      // If child is an object, this is a directory - add its name with a '/' and process its contents
      lines.push(`${indent}${name}/`);

      // Recursively render the contents of this directory with increased indentation
      const sub = renderTree(child, indent + '  '); // Add two spaces for each level of nesting
      if (sub) lines.push(sub); // Add the subdirectory contents if there are any
    }
  }

  // Join all lines with newlines to create the final tree visualization
  return lines.join('\n');
}
