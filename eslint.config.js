import js from '@eslint/js'
import globals from 'globals'
import jest from 'eslint-plugin-jest'
import prettier from 'eslint-plugin-prettier/recommended'

export default [
  js.configs.recommended,
  jest.configs['flat/recommended'],
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    }
  }
]
