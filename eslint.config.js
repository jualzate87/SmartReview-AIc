import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default [
  { ignores: ['dist', '.templates', 'tests', 'scripts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'antd', message: 'Use @ids-ts/* components instead of antd.' },
            { name: '@mui/material', message: 'Use @ids-ts/* components instead of MUI.' },
            { name: '@mui/base', message: 'Use @ids-ts/* components instead of MUI.' },
            { name: '@chakra-ui/react', message: 'Use @ids-ts/* components instead of Chakra UI.' },
            { name: 'tailwindcss', message: 'Tailwind is not allowed. Use design tokens or @ids-ts/* props.' },
            { name: 'bootstrap', message: 'CSS frameworks are not allowed.' },
            { name: '@headlessui/react', message: 'Use @ids-ts/* components.' },
            { name: '@radix-ui/react-*', message: 'Use @ids-ts/* components.' },
            { name: 'classnames', message: 'Avoid utility-first patterns; prefer component props.' },
            { name: 'clsx', message: 'Avoid utility-first patterns; prefer component props.' },
          ],
          patterns: [
            { group: ['@radix-ui/*'], message: 'Use @ids-ts/* components.' },
            { group: ['@mui/*'], message: 'Use @ids-ts/* components.' },
          ],
        },
      ],
    },
  },
]
