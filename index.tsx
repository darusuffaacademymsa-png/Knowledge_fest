
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { FirebaseProvider } from './store/FirebaseContext';
import { TimerProvider } from './store/TimerContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <FirebaseProvider>
        <TimerProvider>
            <App />
        </TimerProvider>
    </FirebaseProvider>
  </React.StrictMode>
);
