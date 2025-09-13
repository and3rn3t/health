import App from '@/MinimalApp';
import { createRoot } from 'react-dom/client';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error(
    'Root element not found. Make sure you have a <div id="root"></div> in your HTML.'
  );
}

createRoot(rootElement).render(<App />);
