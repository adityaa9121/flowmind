import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader } from '../States/Loader';

export const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (currentUser === undefined) {
    return <Loader fullScreen />;
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
