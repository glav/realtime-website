/**
 * App Layout Component
 * 
 * Main application layout with header, navigation, and content area.
 * Includes authentication UI in the header.
 */

import { type ReactNode } from 'react';
import { LoginButton } from '../Auth/LoginButton';
import './AppLayout.css';

export interface AppLayoutProps {
  /** Child components to render in main content area */
  children: ReactNode;
  /** Application title */
  title?: string;
}

export function AppLayout({ children, title = 'Azure OpenAI Chatbot' }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <header className="app-header">
        <h1 className="app-title">{title}</h1>
        <nav className="app-nav">
          <LoginButton />
        </nav>
      </header>
      
      <main className="app-main">
        {children}
      </main>
      
      <footer className="app-footer">
        <p>Powered by Azure OpenAI GPT Realtime</p>
      </footer>
    </div>
  );
}

export default AppLayout;
