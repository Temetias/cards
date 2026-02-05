import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import Index from "./pages/index.tsx";
import Game from "./pages/game.tsx";
import Login from "./pages/login.tsx";
import { useUser, useUserContext } from "./context/UserContext.tsx";

function RequireUser() {
  const { user, loading } = useUser();
  if (loading) {
    return <div>Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function LoginRoute() {
  const { user, loading } = useUser();
  if (loading) {
    return <div>Loading...</div>;
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <Login />;
}

function LogoutRoute() {
  const { refresh } = useUserContext();
  useEffect(() => {
    fetch("/api/user/logout", { method: "POST" }).finally(() => {
      refresh().finally(() => {
        (globalThis as unknown as { location: Location }).location.href =
          "/login";
      });
    });
  }, [refresh]);
  return <div>Logging out...</div>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/logout" element={<LogoutRoute />} />
        <Route element={<RequireUser />}>
          <Route path="/" element={<Index />} />
          <Route path="/game" element={<Game />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
