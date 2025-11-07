import { buildTree, renderTree } from '../src/tree-builder.js';

describe('buildTree', () => {
  describe('when given empty array', () => {
    test('should return empty object', () => {
      const result = buildTree([]);
      expect(result).toEqual({});
    });
  });

  describe('when given single file', () => {
    test('should create tree with single file', () => {
      const result = buildTree(['README.md']);
      expect(result).toEqual({
        'README.md': null
      });
    });

    test('should handle file with extension', () => {
      const result = buildTree(['index.js']);
      expect(result).toEqual({
        'index.js': null
      });
    });
  });

  describe('when given files in directories', () => {
    test('should create nested structure for single directory', () => {
      const result = buildTree(['src/index.js']);
      expect(result).toEqual({
        src: {
          'index.js': null
        }
      });
    });

    test('should create deeply nested structure', () => {
      const result = buildTree(['src/utils/helpers/string.js']);
      expect(result).toEqual({
        src: {
          utils: {
            helpers: {
              'string.js': null
            }
          }
        }
      });
    });

    test('should handle multiple files in same directory', () => {
      const result = buildTree(['src/index.js', 'src/cli.js', 'src/utils.js']);
      expect(result).toEqual({
        src: {
          'index.js': null,
          'cli.js': null,
          'utils.js': null
        }
      });
    });

    test('should handle files in different directories', () => {
      const result = buildTree(['src/index.js', 'tests/index.test.js', 'README.md']);
      expect(result).toEqual({
        src: {
          'index.js': null
        },
        tests: {
          'index.test.js': null
        },
        'README.md': null
      });
    });
  });

  describe('when handling path separators', () => {
    test('should handle forward slashes', () => {
      const result = buildTree(['src/lib/utils.js']);
      expect(result).toEqual({
        src: {
          lib: {
            'utils.js': null
          }
        }
      });
    });

    test('should handle backslashes', () => {
      const result = buildTree(['src\\lib\\utils.js']);
      expect(result).toEqual({
        src: {
          lib: {
            'utils.js': null
          }
        }
      });
    });

    test('should handle mixed separators', () => {
      const result = buildTree(['src/lib\\utils.js']);
      expect(result).toEqual({
        src: {
          lib: {
            'utils.js': null
          }
        }
      });
    });
  });

  describe('when given complex file structure', () => {
    test('should build complete tree with multiple nested directories', () => {
      const files = [
        'package.json',
        'README.md',
        'src/cli.js',
        'src/index.js',
        'src/utils/helper.js',
        'src/utils/string.js',
        'tests/cli.test.js',
        'tests/utils/helper.test.js'
      ];

      const result = buildTree(files);

      expect(result).toEqual({
        'package.json': null,
        'README.md': null,
        src: {
          'cli.js': null,
          'index.js': null,
          utils: {
            'helper.js': null,
            'string.js': null
          }
        },
        tests: {
          'cli.test.js': null,
          utils: {
            'helper.test.js': null
          }
        }
      });
    });
  });

  describe('edge cases', () => {
    test('should handle files with dots in name', () => {
      const result = buildTree(['.gitignore', '.env.example']);
      expect(result).toEqual({
        '.gitignore': null,
        '.env.example': null
      });
    });

    test('should handle files with multiple dots', () => {
      const result = buildTree(['file.min.js', 'config.test.js']);
      expect(result).toEqual({
        'file.min.js': null,
        'config.test.js': null
      });
    });

    test('should handle empty path parts (double slashes)', () => {
      const result = buildTree(['src//index.js']);
      expect(result).toEqual({
        src: {
          'index.js': null
        }
      });
    });

    test('should not create duplicate entries for same file', () => {
      const result = buildTree(['src/index.js', 'src/index.js']);
      expect(result).toEqual({
        src: {
          'index.js': null
        }
      });
    });
  });
});

describe('renderTree', () => {
  describe('when given empty tree', () => {
    test('should return empty string', () => {
      const result = renderTree({});
      expect(result).toBe('');
    });
  });

  describe('when given single file', () => {
    test('should render file without indentation', () => {
      const tree = { 'README.md': null };
      const result = renderTree(tree);
      expect(result).toBe('README.md');
    });
  });

  describe('when given files and directories', () => {
    test('should render directory with trailing slash', () => {
      const tree = {
        src: {
          'index.js': null
        }
      };
      const result = renderTree(tree);
      expect(result).toBe('src/\n  index.js');
    });

    test('should render multiple files in directory', () => {
      const tree = {
        src: {
          'cli.js': null,
          'index.js': null
        }
      };
      const result = renderTree(tree);
      expect(result).toBe('src/\n  cli.js\n  index.js');
    });

    test('should render nested directories with proper indentation', () => {
      const tree = {
        src: {
          utils: {
            'helper.js': null
          }
        }
      };
      const result = renderTree(tree);
      expect(result).toBe('src/\n  utils/\n    helper.js');
    });
  });

  describe('sorting behavior', () => {
    test('should sort directories before files', () => {
      const tree = {
        'file.js': null,
        folder: {
          'nested.js': null
        },
        'another.js': null
      };
      const result = renderTree(tree);
      expect(result).toBe('folder/\n  nested.js\nanother.js\nfile.js');
    });

    test('should sort directories alphabetically', () => {
      const tree = {
        zebra: {},
        alpha: {},
        beta: {}
      };
      const result = renderTree(tree);
      expect(result).toBe('alpha/\nbeta/\nzebra/');
    });

    test('should sort files alphabetically', () => {
      const tree = {
        'zebra.js': null,
        'alpha.js': null,
        'beta.js': null
      };
      const result = renderTree(tree);
      expect(result).toBe('alpha.js\nbeta.js\nzebra.js');
    });
  });

  describe('complex structures', () => {
    test('should render complete project structure', () => {
      const tree = {
        'package.json': null,
        'README.md': null,
        src: {
          'cli.js': null,
          'index.js': null,
          utils: {
            'helper.js': null
          }
        },
        tests: {
          'cli.test.js': null
        }
      };
      const result = renderTree(tree);
      const expected = [
        'src/',
        '  utils/',
        '    helper.js',
        '  cli.js',
        '  index.js',
        'tests/',
        '  cli.test.js',
        'package.json',
        'README.md'
      ].join('\n');
      expect(result).toBe(expected);
    });

    test('should handle deeply nested structure', () => {
      const tree = {
        a: {
          b: {
            c: {
              'd.txt': null
            }
          }
        }
      };
      const result = renderTree(tree);
      expect(result).toBe('a/\n  b/\n    c/\n      d.txt');
    });
  });

  describe('with custom indentation', () => {
    test('should accept custom indent parameter', () => {
      const tree = {
        src: {
          'index.js': null
        }
      };
      const result = renderTree(tree, '>>');
      expect(result).toBe('>>src/\n>>  index.js');
    });
  });

  describe('edge cases', () => {
    test('should handle empty directories', () => {
      const tree = {
        'empty-folder': {}
      };
      const result = renderTree(tree);
      expect(result).toBe('empty-folder/');
    });

    test('should handle dotfiles', () => {
      const tree = {
        '.gitignore': null,
        '.env': null
      };
      const result = renderTree(tree);
      expect(result).toBe('.env\n.gitignore');
    });
  });
});

describe('integration: buildTree + renderTree', () => {
  test('should build and render simple structure', () => {
    const files = ['README.md', 'src/index.js'];
    const tree = buildTree(files);
    const result = renderTree(tree);
    expect(result).toBe('src/\n  index.js\nREADME.md');
  });

  test('should build and render complex structure', () => {
    const files = [
      'package.json',
      'src/cli.js',
      'src/index.js',
      'tests/cli.test.js'
    ];
    const tree = buildTree(files);
    const result = renderTree(tree);
    const expected = [
      'src/',
      '  cli.js',
      '  index.js',
      'tests/',
      '  cli.test.js',
      'package.json'
    ].join('\n');
    expect(result).toBe(expected);
  });
});
