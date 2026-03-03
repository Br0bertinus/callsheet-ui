import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GameProvider } from './context/GameContext';
import { SetupPage } from './pages/SetupPage';
import { GamePage } from './pages/GamePage';
import { WinPage } from './pages/WinPage';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry failed searches — stale data is better than repeated errors
      retry: false,
    },
  },
});

// GameProvider is the layout route — it owns all game state and provides it
// to every child route via context.
const router = createBrowserRouter([
  {
    element: <GameProvider />,
    children: [
      { path: '/',     element: <SetupPage /> },
      { path: '/game', element: <GamePage /> },
      { path: '/win',  element: <WinPage /> },
    ],
  },
]);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Check index.html for <div id="root">.');
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
