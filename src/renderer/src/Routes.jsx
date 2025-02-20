import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Flows from './pages/Flows';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Setup from './pages/Setup';

const Routes = () => {
  const { isAuthenticated, isSetupComplete } = useAuth();

  // Create protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!isSetupComplete) {
      return <Navigate to="/setup" replace />;
    }
    
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  // Create auth routes wrapper
  const AuthRoute = ({ children }) => {
    if (isAuthenticated) {
      return <Navigate to="/" replace />;
    }

    if (!isSetupComplete && window.location.pathname !== '/setup') {
      return <Navigate to="/setup" replace />;
    }

    if (isSetupComplete && window.location.pathname === '/setup') {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  const router = createBrowserRouter([
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <Dashboard />,
        },
        {
          path: 'flows',
          element: <Flows />,
        },
        {
          path: 'settings',
          element: <Settings />,
        },
        {
          path: '*',
          element: <NotFound />,
        },
      ],
    },
    {
      path: 'login',
      element: (
        <AuthRoute>
          <Login />
        </AuthRoute>
      ),
    },
    {
      path: 'setup',
      element: (
        <AuthRoute>
          <Setup />
        </AuthRoute>
      ),
    },
  ]);

  return <RouterProvider router={router} />;
};

export default Routes; 