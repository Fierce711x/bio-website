import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./layouts/root-layout";
import LandingPage from "../../pages/LandingPage";
import RequireAuth from "./layouts/requireAuth";
import LoginPage from "../../auth/pages/LoginPage";
import RequireGuest from "./layouts/requireGuest";
import SignupPage from "../../auth/pages/SignupPage";
import AuthProvider from "../../auth/provider/authProvider";
import NotFound from "../../pages/NotFound";

export const router = createBrowserRouter([
  {
    element: <AuthProvider />,
    children: [
      {
        element: <RootLayout />,
        children: [
          {
            path: "/",
            element: <LandingPage />,
          },
          {
            element: <RequireGuest />,
            children: [
              {
                path: "login",
                element: <LoginPage />,
              },
              {
                path: "signup",
                element: <SignupPage />,
              },
            ],
          },
          {
            element: <RequireAuth />,
            children: [{ path: "/dashboard", element: <div>dashboard</div> }],
          },
          {
            path: "*",
            element: <NotFound />,
          },
        ],
      },
    ],
  },
]);
