import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthGuard from '@/components/AuthGuard';
import MainLayout from '@/layouts/MainLayout';
import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import AttractionsList from '@/pages/attractions';
import AttractionEdit from '@/pages/attractions/edit';
import Images from '@/pages/images';
import Hotels from '@/pages/hotels';
import Orders from '@/pages/orders';
import Feedback from '@/pages/feedback';
import Users from '@/pages/users';
import Settings from '@/pages/settings';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'attractions',
        element: <AttractionsList />,
      },
      {
        path: 'attractions/create',
        element: <AttractionEdit />,
      },
      {
        path: 'attractions/edit/:id',
        element: <AttractionEdit />,
      },
      {
        path: 'images',
        element: <Images />,
      },
      {
        path: 'hotels',
        element: <Hotels />,
      },
      {
        path: 'orders',
        element: <Orders />,
      },
      {
        path: 'feedback',
        element: <Feedback />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);

export default router;
