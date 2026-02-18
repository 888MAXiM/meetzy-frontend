import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MessengerContainer from '../components/messenger'
import HelpSection from '../components/messenger/help'
import { ROUTES } from '../constants/route'
import NotFound from '../pages/NotFound'
import { AuthRoutes } from './AuthRoutes'
import { ProtectedRoute } from './Middleware'

const Routers = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.Home} element={<Navigate to={ROUTES.Messenger} replace />} />
        <Route
          path={ROUTES.Messenger}
          element={
            <ProtectedRoute>
              <MessengerContainer />
            </ProtectedRoute>
          }
        />
        <Route path={ROUTES.Help} element={<HelpSection />} />
        {AuthRoutes.map((item, index) => (
          <Route key={index} path={item.path} element={item.element} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Routers
