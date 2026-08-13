import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

// ============================================================
// ESLint — enfocado en ERRORES REALES (correctitud), no estilo:
// variables no definidas, imports sin usar, reglas de hooks.
// El proyecto usa estilos inline y JSX extenso; no se lintea formato.
// ============================================================
export default [
  { ignores: ['dist/**', 'node_modules/**', 'supabase/**', 'dev-dist/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}', 'scripts/**/*.{js,mjs}', 'vite.config.js'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.node,
        __BUILD_TIME__: 'readonly', // inyectada por Vite (define)
      },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // Marca como "usadas" las variables referenciadas solo en JSX (<Btn />)
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      // Reglas de hooks: la fuente nº1 de bugs sutiles en React
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off', // el código usa eslint-disable puntuales a propósito
      // Correctitud
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-undef': 'error',
      // El codebase usa estos patrones a propósito; no aportan como error
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-unsafe-optional-chaining': 'warn',
    },
  },
]
