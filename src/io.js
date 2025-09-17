
import fs from 'node:fs';    
import path from 'node:path'; 


const MAX_FILE_SIZE = 16 * 1024;

// Function that tries to detect if a file contains binary data (not human-readable text)
// Binary files include images, videos, executable programs, etc.
export function isLikelyBinary(buf) {
  const len = Math.min(buf.length, 8000);  // Check at most the first 8000 bytes
  if (len === 0) return false;              // Empty files are not binary
  
  let suspicious = 0;  // Counter for suspicious (non-text) characters
  
  // Go through each byte in the file
  for (let i = 0; i < len; i++) {
    const b = buf[i];  // Get the byte value (0-255)
    
    if (b === 0) return true; // Null bytes (0) almost always mean binary data
    
    // Count characters that are not typical text characters
    // 9=tab, 10=newline, 13=carriage return, 32-126=printable ASCII characters
    if (b !== 9 && b !== 10 && b !== 13 && (b < 32 || b > 126)) suspicious++;
  }
  
  // If more than 30% of characters are suspicious, it's probably binary
  return suspicious / len > 0.3;
}

// Function that formats a file's content into a nice section for the final output
// Creates a header with the file path and wraps the content in code blocks
export function renderFileSection(relPath, content, truncated) {
  return [
    `\n### File: ${relPath}\n`,
    '```',
    content,
    '```',
    truncated ? '\n> [truncated]\n' : ''
  ].join('\n');
}

/**
 * Main function that reads all files and creates formatted content sections with statistics
 * This function goes through each file, reads its content, and prepares it for the final output
 * It also keeps track of various statistics like how many files were processed
 */
export function readFilesAndSummarize(filesAbs, baseDir) {
  let totalTextFiles = 0;
  let totalLines = 0;
  let skippedBinary = 0;
  let truncatedFiles = 0;

  const sections = [];

  // Process each file in the list
  for (const fileAbs of filesAbs) {
    let buf;
    try {
      // Try to read the entire file into memory as raw bytes
      buf = fs.readFileSync(fileAbs);
    } catch (e) {
      console.error(`[skip] Cannot read: ${fileAbs} — ${e.message}`);
      continue;
    }

    if (isLikelyBinary(buf)) {
      // If it's binary, we can't display it as text, so skip it and count it
      skippedBinary++;
      continue;
    }

    // Prepare variables for handling file content
    let truncated = false;  // Flag to track if we had to cut off the file
    let content;           

    // Check if the file is too large to process completely
    if (buf.length > MAX_FILE_SIZE) {
      content = buf.toString('utf8', 0, MAX_FILE_SIZE);
      truncated = true;
      truncatedFiles++;
    } else {
      content = buf.toString('utf8');
    }

    const rel = path.relative(baseDir, fileAbs) || path.basename(fileAbs);
    
    // Count how many lines are in this file (split by line breaks)
    const lineCount = content.split(/\r?\n/).length;

    totalTextFiles++;
    totalLines += lineCount;

    // Create a formatted section for this file and add it to our collection
    sections.push(renderFileSection(rel, content, truncated));
  }

  // Return both the formatted content sections and the statistics
  return {
    sections,
    stats: { totalTextFiles, totalLines, skippedBinary, truncatedFiles }
  };
}