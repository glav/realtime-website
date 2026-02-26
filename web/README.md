# Azure OpenAI GPT Realtime Chatbot

A React + TypeScript + Vite web application featuring an Azure OpenAI-powered chatbot with text and voice interaction capabilities.

## Features

- **Text chat interface** using Azure OpenAI
- **Voice interaction features** with Web Audio API
- **Azure AD authentication** (MSAL.js)
- **Responsive design** for mobile and desktop
- Hot module replacement (HMR) for fast development

## Quick Start

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn package manager

### Development Server

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (Vite will display the exact URL in the terminal).

### Production Build

Build optimized production assets:

```bash
npm run build
```

This compiles TypeScript and outputs to the `dist/` directory.

### Preview Production Build

Serve the production build locally for testing:

```bash
npm run preview
```

## Available Commands

### Development
- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Code Quality
- `npm run lint` - Run ESLint to check code quality

### Testing
- `npm run test` - Run unit tests (Jest)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:e2e` - Run end-to-end tests (Playwright)

## Project Structure

```
web/
├── src/              # Source code
├── public/           # Static assets
├── dist/             # Production build output
├── e2e/              # End-to-end tests
├── __mocks__/        # Test mocks
└── index.html        # Entry HTML file
```

## Technology Stack

- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Jest** - Unit testing framework
- **Playwright** - E2E testing framework
- **ESLint** - Code linting
- **Azure OpenAI** - AI-powered chat capabilities
- **MSAL.js** - Microsoft Authentication Library

## Development Notes

This application follows a hybrid testing strategy combining TDD, code-first, and E2E approaches. The implementation was completed in 8 phases focusing on authentication, chat interface, voice features, and testing.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
