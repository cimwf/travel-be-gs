import { lazy, Suspense, type ReactNode } from 'react';
import { Spin } from 'antd';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthGuard from '@/components/AuthGuard';
import MainLayout from '@/layouts/MainLayout';

const Login = lazy(() => import('@/pages/login'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const AttractionsList = lazy(() => import('@/pages/attractions'));
const AttractionEdit = lazy(() => import('@/pages/attractions/edit'));
const AttractionQuickAdd = lazy(() => import('@/pages/attractions/quickAdd'));
const AttractionQuickList = lazy(() => import('@/pages/attractions/quickList'));
const Images = lazy(() => import('@/pages/images'));
const Banners = lazy(() => import('@/pages/banners'));
const Hotels = lazy(() => import('@/pages/hotels'));
const Feedback = lazy(() => import('@/pages/feedback'));
const CommunityReviews = lazy(() => import('@/pages/communityReviews'));
const TripReviews = lazy(() => import('@/pages/tripReviews'));
const TripLogReviews = lazy(() => import('@/pages/tripLogReviews'));
const UserSpots = lazy(() => import('@/pages/userSpots'));
const Users = lazy(() => import('@/pages/users'));
const Settings = lazy(() => import('@/pages/settings'));

const page = (element: ReactNode) => (
  <Suspense
    fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
        <Spin />
      </div>
    }
  >
    {element}
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/login',
    element: page(<Login />),
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
        element: page(<Dashboard />),
      },
      {
        path: 'attractions',
        element: page(<AttractionsList />),
      },
      {
        path: 'attractions/create',
        element: page(<AttractionEdit />),
      },
      {
        path: 'attractions/quickAdd',
        element: page(<AttractionQuickAdd />),
      },
      {
        path: 'attractions/quickList',
        element: page(<AttractionQuickList />),
      },
      {
        path: 'attractions/edit/:id',
        element: page(<AttractionEdit />),
      },
      {
        path: 'images',
        element: page(<Images />),
      },
      {
        path: 'banners',
        element: page(<Banners />),
      },
      {
        path: 'hotels',
        element: page(<Hotels />),
      },
      {
        path: 'feedback',
        element: page(<Feedback />),
      },
      {
        path: 'community-reviews',
        element: page(<CommunityReviews />),
      },
      {
        path: 'trip-reviews',
        element: page(<TripReviews />),
      },
      {
        path: 'trip-log-reviews',
        element: page(<TripLogReviews />),
      },
      {
        path: 'userSpots',
        element: page(<UserSpots />),
      },
      {
        path: 'users',
        element: page(<Users />),
      },
      {
        path: 'settings',
        element: page(<Settings />),
      },
    ],
  },
]);

export default router;
