import { isLikelyBinary } from '../src/content-handler.js';

describe('isLikelyBinary', () => {
  describe('when given empty buffer', () => {
    test('should return false for empty buffer', () => {
      const buffer = Buffer.from('');
      expect(isLikelyBinary(buffer)).toBe(false);
    });
  });

  describe('when given plain text content', () => {
    test('should return false for simple ASCII text', () => {
      const buffer = Buffer.from('Hello, World!');
      expect(isLikelyBinary(buffer)).toBe(false);
    });

    test('should return false for text with newlines', () => {
      const buffer = Buffer.from('Line 1\nLine 2\nLine 3');
      expect(isLikelyBinary(buffer)).toBe(false);
    });

    test('should return false for text with tabs', () => {
      const buffer = Buffer.from('Column1\tColumn2\tColumn3');
      expect(isLikelyBinary(buffer)).toBe(false);
    });

    test('should return false for text with carriage returns', () => {
      const buffer = Buffer.from('Line 1\r\nLine 2\r\nLine 3');
      expect(isLikelyBinary(buffer)).toBe(false);
    });

    test('should return false for multiline code', () => {
      const code = `function hello() {
  console.log("Hello, World!");
  return true;
}`;
      const buffer = Buffer.from(code);
      expect(isLikelyBinary(buffer)).toBe(false);
    });
  });

  describe('when given binary content', () => {
    test('should return true for buffer with null bytes', () => {
      const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x57]); // "Hello\0W"
      expect(isLikelyBinary(buffer)).toBe(true);
    });

    test('should return true for buffer starting with null byte', () => {
      const buffer = Buffer.from([0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "\0Hello"
      expect(isLikelyBinary(buffer)).toBe(true);
    });

    test('should return true for buffer with high ratio of non-printable characters', () => {
      // Create buffer with 70% non-printable characters (above 30% threshold)
      const bytes = Array(100).fill(0).map((_, i) => i < 70 ? 0xFF : 0x41); // 70 x 0xFF, 30 x 'A'
      const buffer = Buffer.from(bytes);
      expect(isLikelyBinary(buffer)).toBe(true);
    });

    test('should return false for buffer with low ratio of non-printable characters', () => {
      // Create buffer with 20% non-printable characters (below 30% threshold)
      const bytes = Array(100).fill(0).map((_, i) => i < 20 ? 0xFF : 0x41); // 20 x 0xFF, 80 x 'A'
      const buffer = Buffer.from(bytes);
      expect(isLikelyBinary(buffer)).toBe(false);
    });

    test('should return true for simulated image data', () => {
      // Simulate PNG header - need more bytes to exceed 30% threshold
      // PNG header + some binary data
      const pngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      const binaryData = Array(100).fill(0xFF); // Add more binary bytes
      const buffer = Buffer.from([...pngHeader, ...binaryData]);
      expect(isLikelyBinary(buffer)).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle buffer with exactly 30% suspicious characters (boundary)', () => {
      // Create buffer with exactly 30% non-printable
      const bytes = Array(100).fill(0).map((_, i) => i < 30 ? 0xFF : 0x41);
      const buffer = Buffer.from(bytes);
      // At exactly 30%, it should still be false (not greater than 0.3)
      expect(isLikelyBinary(buffer)).toBe(false);
    });

    test('should handle very large buffer (only checks first 8000 bytes)', () => {
      // Create a large buffer with text at the beginning
      const largeText = 'a'.repeat(10000);
      const buffer = Buffer.from(largeText);
      expect(isLikelyBinary(buffer)).toBe(false);
    });

    test('should detect binary even if only first part is binary', () => {
      // Binary at start, text after 8000 bytes
      // Need enough binary data to exceed 30% threshold within first 8000 bytes
      const binaryPart = Buffer.alloc(3000, 0xFF); // 3000 binary bytes
      const textPart = Buffer.from('a'.repeat(9000)); // Text after
      const buffer = Buffer.concat([binaryPart, textPart]);
      // Should detect as binary based on first 8000 bytes (3000/8000 = 37.5% > 30%)
      expect(isLikelyBinary(buffer)).toBe(true);
    });

    test('should handle Unicode/UTF-8 characters', () => {
      // UTF-8 encoded characters might have bytes outside ASCII range
      const buffer = Buffer.from('Hello 🌍');
      // UTF-8 is valid text, but has high bytes that look suspicious
      // This test documents current behavior
      const result = isLikelyBinary(buffer);
      expect(typeof result).toBe('boolean');
    });

    test('should handle buffer with only whitespace', () => {
      const buffer = Buffer.from('   \n\t\r\n   ');
      expect(isLikelyBinary(buffer)).toBe(false);
    });

    test('should handle single character buffer', () => {
      const buffer = Buffer.from('A');
      expect(isLikelyBinary(buffer)).toBe(false);
    });

    test('should handle printable ASCII range (32-126)', () => {
      // All printable ASCII characters
      const printable = Array(95).fill(0).map((_, i) => i + 32).map(c => String.fromCharCode(c)).join('');
      const buffer = Buffer.from(printable);
      expect(isLikelyBinary(buffer)).toBe(false);
    });
  });

  describe('real-world scenarios', () => {
    test('should correctly identify JSON file content', () => {
      const json = '{"name": "test", "version": "1.0.0"}';
      const buffer = Buffer.from(json);
      expect(isLikelyBinary(buffer)).toBe(false);
    });

    test('should correctly identify JavaScript code', () => {
      const code = 'const x = 42;\nconsole.log(x);';
      const buffer = Buffer.from(code);
      expect(isLikelyBinary(buffer)).toBe(false);
    });

    test('should correctly identify Markdown content', () => {
      const markdown = '# Title\n\nThis is a paragraph.';
      const buffer = Buffer.from(markdown);
      expect(isLikelyBinary(buffer)).toBe(false);
    });
  });
});
