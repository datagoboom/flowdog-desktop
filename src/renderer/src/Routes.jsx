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
  const AuthRoute = ({ children, isSetupRoute }) => {
    // Always allow access to setup if it's not complete
    if (!isSetupComplete && isSetupRoute) {
      return children;
    }

    // Redirect to setup if not complete and trying to access login
    if (!isSetupComplete && !isSetupRoute) {
      return <Navigate to="/setup" replace />;
    }

    // Redirect to login if setup is complete and not authenticated
    if (isSetupComplete && !isAuthenticated && !isSetupRoute) {
      return children;
    }

    // Redirect to home if authenticated
    if (isAuthenticated) {
      return <Navigate to="/" replace />;
    }

    // Redirect to login if setup is complete but trying to access setup
    if (isSetupComplete && isSetupRoute) {
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
        <AuthRoute isSetupRoute={false}>
          <Login />
        </AuthRoute>
      ),
    },
    {
      path: 'setup',
      element: (
        <AuthRoute isSetupRoute={true}>
          <Setup />
        </AuthRoute>
      ),
    },
  ]);

  return <RouterProvider router={router} />;
};

export default Routes; 