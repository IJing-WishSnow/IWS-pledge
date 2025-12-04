const path = require('path');

module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['plugin:react/recommended', 'plugin:prettier/recommended', 'airbnb', 'airbnb/hooks', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint'],
  rules: {
    'no-var': 'error',
    // 优先使用 interface 而不是 type
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    'react/button-has-type': 'off',
    'react/prop-types': 'off',
    'react/sort-comp': 'off',
    'import/extensions': 'off',
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
    // 取消 .d.ts 声明文件中使用了 constructor 报错
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': [
      'warn',
      {
        additionalHooks: 'useRecoilCallback',
      },
    ],

    // ========== 新增规则修复 ==========

    // 修复 React 使用前未定义错误
    'no-use-before-define': 'off', // 关闭 ESLint 默认规则
    '@typescript-eslint/no-use-before-define': ['error'], // 使用 TypeScript 规则

    // 修复箭头函数体风格警告
    'arrow-body-style': ['error', 'as-needed'],

    // 修复 props spreading 警告（根据项目需要选择）
    'react/jsx-props-no-spreading': 'off', // 关闭规则，允许 props spreading

    // 修复默认导入问题
    'import/prefer-default-export': 'off',

    // 修复 React 版本检测问题
    'react/jsx-uses-react': 'off', // React 17+ 不需要显式导入 React
    'react/react-in-jsx-scope': 'off', // React 17+ 不需要
  },
  overrides: [
    {
      files: ['**/*.d.ts'],
      rules: {
        'import/no-duplicates': 0,
      },
    },
  ],
  settings: {
    'import/resolver': {
      // 添加 TypeScript 解析器（使用刚才安装的插件）
      typescript: {
        alwaysTryTypes: true, // 始终尝试 TypeScript 解析
        project: path.resolve(__dirname, './tsconfig.json'), // 指定 tsconfig 路径
      },
      node: {
        extensions: ['.js', '.less', '.jsx', '.json', '.jsonc', '.wasm', '.ts', '.tsx'], // 添加 .ts 和 .tsx
      },
      alias: {
        map: [
          ['_src', path.resolve(__dirname, './src/')],
          ['_components', path.resolve(__dirname, './src/components/')],
          ['_containers', path.resolve(__dirname, './src/containers/')],
          ['_constants', path.resolve(__dirname, './src/constants/')],
          ['_utils', path.resolve(__dirname, './src/utils/')],
          ['_assets', path.resolve(__dirname, 'src/assets/')],
          ['_abis', path.resolve(__dirname, 'src/abis/')],
        ],
        extensions: ['.js', '.less', '.jsx', '.json', '.jsonc', '.wasm', '.ts', '.tsx'], // 添加 .ts 和 .tsx
      },
    },
  },
};
