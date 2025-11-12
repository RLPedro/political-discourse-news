import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './pages/App';
import TopicReport from './pages/TopicReport';
import MultiReport from './pages/MultiReport';

const router = createBrowserRouter([
  // { path: '/', element: <App /> },
  { path: '/', element: <MultiReport /> },
  // { path: '/report', element: <TopicReport /> },
  // { path: '/report/multi', element: <MultiReport /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
