import { Link, useLocation } from "react-router-dom";
import "./Layout.css";
import { useUser } from "../../context/UserContext.tsx";
import { useState } from "react";
import { Guide } from "../Guide/Guide.tsx";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const location = useLocation();
  const [showGuide, setShowGuide] = useState(false);
  if (!user || location.pathname === "/game") return children;
  return (
    <div className="Layout">
      <header className="Layout-Header">
        <div>
          <h1>v2cards</h1>
        </div>
        <div>{user?.name || ""}</div>
      </header>
      <main className="Layout-Main">{children}</main>
      <footer className="Layout-Footer">
        <div>
          {location.pathname !== "/" && (
            <Link to="..">
              <button type="button">Back</button>
            </Link>
          )}
        </div>
        <div>
          <button type="button" onClick={() => setShowGuide(true)}>
            Info
          </button>
        </div>
      </footer>
      {showGuide && <Guide onClose={() => setShowGuide(false)} />}
    </div>
  );
}
