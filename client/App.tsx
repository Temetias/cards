import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import Index from "./pages/index.tsx";
import Game from "./pages/game/game.tsx";
import Login from "./pages/login/login.tsx";
import Decks, { DeckEdit } from "./pages/decks/decks.tsx";
import { useUser, useUserContext } from "./context/UserContext.tsx";
import {
  LoadingOverlayProvider,
  useLoadingOverlay,
} from "./context/LoadingOverlayContext/LoadingOverlayContext.tsx";

function RequireUser() {
  const { user, loading } = useUser();
  const { setMessage, setpercentage, setShow } = useLoadingOverlay();

  useEffect(() => {
    setShow(loading);
    setMessage("Checking user authentication...");
    setpercentage(null);
  }, [user, loading, setMessage, setpercentage, setShow]);
  if (loading) {
    return null;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function LoginRoute() {
  const { user, loading } = useUser();
  const { setMessage, setpercentage, setShow } = useLoadingOverlay();

  useEffect(() => {
    setShow(loading);
    setMessage("Checking user authentication...");
    setpercentage(null);
  }, [user, loading, setMessage, setpercentage, setShow]);
  if (loading) {
    return null;
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
      <LoadingOverlayProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/logout" element={<LogoutRoute />} />
          <Route element={<RequireUser />}>
            <Route path="/" element={<Index />} />
            <Route path="/game" element={<Game />} />
            <Route path="/decks" element={<Decks />} />
            <Route path="/decks/new" element={<DeckEdit />} />
            <Route path="/decks/:id" element={<DeckEdit />} />
          </Route>
        </Routes>
      </LoadingOverlayProvider>
    </BrowserRouter>
  );
}

export default App;
