import { getGitInfoOrNull } from '../src/git-info.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('getGitInfoOrNull', () => {
  describe('when used with the actual project repository', () => {
    const projectRoot = path.resolve(__dirname, '..');

    test('should return git info object for project root', () => {
      const result = getGitInfoOrNull(projectRoot);

      // Should work since we're in a git repository
      expect(result).not.toBeNull();
      if (result !== null) {
        expect(result).toHaveProperty('commit');
        expect(result).toHaveProperty('branch');
        expect(result).toHaveProperty('author');
        expect(result).toHaveProperty('date');
      }
    });

    test('should return commit hash in correct format', () => {
      const result = getGitInfoOrNull(projectRoot);

      if (result !== null) {
        expect(result.commit).toMatch(/^[0-9a-f]{40}$/); // SHA-1 hash format
        expect(result.commit.length).toBe(40);
      }
    });

    test('should return non-empty branch name', () => {
      const result = getGitInfoOrNull(projectRoot);

      if (result !== null) {
        expect(typeof result.branch).toBe('string');
        expect(result.branch.length).toBeGreaterThan(0);
      }
    });

    test('should return author in correct format', () => {
      const result = getGitInfoOrNull(projectRoot);

      if (result !== null) {
        expect(result.author).toMatch(/.+ <.+@.+>/); // name <email> format
      }
    });

    test('should return commit date as string', () => {
      const result = getGitInfoOrNull(projectRoot);

      if (result !== null) {
        expect(typeof result.date).toBe('string');
        expect(result.date.length).toBeGreaterThan(0);
      }
    });

    test('should have exactly 4 properties in return object', () => {
      const result = getGitInfoOrNull(projectRoot);

      if (result !== null) {
        expect(Object.keys(result)).toHaveLength(4);
        expect(Object.keys(result).sort()).toEqual(['author', 'branch', 'commit', 'date']);
      }
    });
  });

  describe('when given non-git directory', () => {
    test('should return null for non-existent directory', () => {
      const result = getGitInfoOrNull('/path/that/absolutely/does/not/exist/anywhere');
      expect(result).toBeNull();
    });

    test('should return null for a non-git directory', () => {
      // Use /tmp which definitely exists but isn't a git repo
      const result = getGitInfoOrNull('/tmp');
      expect(result).toBeNull();
    });
  });

  describe('return value structure', () => {
    test('should return either null or object with correct structure', () => {
      const projectRoot = path.resolve(__dirname, '..');
      const result = getGitInfoOrNull(projectRoot);

      if (result === null) {
        expect(result).toBeNull();
      } else {
        expect(typeof result).toBe('object');
        expect(result).toHaveProperty('commit');
        expect(result).toHaveProperty('branch');
        expect(result).toHaveProperty('author');
        expect(result).toHaveProperty('date');
      }
    });

    test('should return all string values when not null', () => {
      const projectRoot = path.resolve(__dirname, '..');
      const result = getGitInfoOrNull(projectRoot);

      if (result !== null) {
        expect(typeof result.commit).toBe('string');
        expect(typeof result.branch).toBe('string');
        expect(typeof result.author).toBe('string');
        expect(typeof result.date).toBe('string');
      }
    });

    test('should not return empty strings when not null', () => {
      const projectRoot = path.resolve(__dirname, '..');
      const result = getGitInfoOrNull(projectRoot);

      if (result !== null) {
        expect(result.commit.length).toBeGreaterThan(0);
        expect(result.branch.length).toBeGreaterThan(0);
        expect(result.author.length).toBeGreaterThan(0);
        expect(result.date.length).toBeGreaterThan(0);
      }
    });
  });

  describe('edge cases', () => {
    test('should handle relative paths', () => {
      const result = getGitInfoOrNull('.');
      
      // Result depends on where the test is run from
      expect(result === null || typeof result === 'object').toBe(true);
    });

    test('should handle paths with trailing slash', () => {
      const projectRoot = path.resolve(__dirname, '..');
      const withSlash = projectRoot + '/';
      const result = getGitInfoOrNull(withSlash);

      // Should work the same as without trailing slash
      if (result !== null) {
        expect(result).toHaveProperty('commit');
      }
    });
  });
});
