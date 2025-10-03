import fs from 'node:fs';
import path from 'node:path';
import toml from 'toml';

/**
 * Load configuration from .repomaster-config.toml if exists
 */
export function loadTomlConfig(configPath = '.repomaster-config.toml') {
  const fullPath = path.resolve(configPath);
  if (!fs.existsSync(fullPath)) return {};

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    return toml.parse(content);
  } catch (error) {
    console.error(`Error parsing TOML config: ${error.message}`);
    return {};
  }
}
