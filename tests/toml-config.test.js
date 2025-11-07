import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jest } from '@jest/globals';
import { loadTomlConfig } from '../src/toml-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('loadTomlConfig', () => {
  const testDir = path.join(__dirname, 'fixtures');
  const validConfigPath = path.join(testDir, 'valid-config.toml');
  const emptyConfigPath = path.join(testDir, 'empty-config.toml');
  const invalidConfigPath = path.join(testDir, 'invalid-config.toml');
  const nonExistentPath = path.join(testDir, 'non-existent.toml');

  // Set up test fixtures
  beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create valid config file
    fs.writeFileSync(validConfigPath, `
output = 'test.txt'
noGitIgnore = true
lineNumbers = true
recent = 7
grep = 'TODO'
include = '*.js,*.py'
    `);

    // Create empty config file
    fs.writeFileSync(emptyConfigPath, '');

    // Create invalid config file
    fs.writeFileSync(invalidConfigPath, 'invalid toml [[[syntax');
  });

  // Clean up test fixtures
  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  // Spy on console.error
  let consoleErrorSpy;
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('when config file does not exist', () => {
    test('should return empty object', () => {
      const result = loadTomlConfig(nonExistentPath);

      expect(result).toEqual({});
    });

    test('should return empty object with default path that does not exist', () => {
      const result = loadTomlConfig('this-file-absolutely-does-not-exist.toml');

      expect(result).toEqual({});
    });
  });

  describe('when config file exists and is valid', () => {
    test('should parse and return TOML content', () => {
      const result = loadTomlConfig(validConfigPath);

      expect(result).toEqual({
        output: 'test.txt',
        noGitIgnore: true,
        lineNumbers: true,
        recent: 7,
        grep: 'TODO',
        include: '*.js,*.py'
      });
    });

    test('should handle empty TOML file', () => {
      const result = loadTomlConfig(emptyConfigPath);

      expect(result).toEqual({});
    });

    test('should handle TOML with only comments', () => {
      const commentsOnlyPath = path.join(testDir, 'comments-only.toml');
      fs.writeFileSync(commentsOnlyPath, '# This is a comment\n# Another comment');

      const result = loadTomlConfig(commentsOnlyPath);

      expect(result).toEqual({});
      fs.unlinkSync(commentsOnlyPath);
    });

    test('should handle TOML with various data types', () => {
      const typesPath = path.join(testDir, 'types.toml');
      fs.writeFileSync(typesPath, `
stringValue = "test"
boolValue = true
numberValue = 42
floatValue = 3.14
      `);

      const result = loadTomlConfig(typesPath);

      expect(result).toEqual({
        stringValue: 'test',
        boolValue: true,
        numberValue: 42,
        floatValue: 3.14
      });
      fs.unlinkSync(typesPath);
    });
  });

  describe('when config file has parsing errors', () => {
    test('should return empty object and log error for invalid TOML syntax', () => {
      const result = loadTomlConfig(invalidConfigPath);

      expect(result).toEqual({});
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Error parsing TOML config:/)
      );
    });

    test('should handle malformed TOML with unclosed quotes', () => {
      const malformedPath = path.join(testDir, 'malformed.toml');
      fs.writeFileSync(malformedPath, 'output = "unclosed string');

      const result = loadTomlConfig(malformedPath);

      expect(result).toEqual({});
      expect(consoleErrorSpy).toHaveBeenCalled();
      fs.unlinkSync(malformedPath);
    });

    test('should handle TOML with duplicate keys', () => {
      const duplicatePath = path.join(testDir, 'duplicate.toml');
      fs.writeFileSync(duplicatePath, 'output = "test1"\noutput = "test2"');

      const result = loadTomlConfig(duplicatePath);

      expect(result).toEqual({});
      expect(consoleErrorSpy).toHaveBeenCalled();
      fs.unlinkSync(duplicatePath);
    });
  });

  describe('edge cases', () => {
    test('should use default path when called with no arguments', () => {
      // This will look for .repomaster-config.toml in current directory
      const result = loadTomlConfig();

      // Should return object (could be empty or have config depending on environment)
      expect(typeof result).toBe('object');
    });

    test('should handle absolute path', () => {
      const result = loadTomlConfig(validConfigPath);

      expect(result.output).toBe('test.txt');
    });

    test('should handle relative path', () => {
      const relativePath = path.relative(process.cwd(), validConfigPath);
      const result = loadTomlConfig(relativePath);

      expect(result.output).toBe('test.txt');
    });
  });
});
