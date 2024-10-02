import React, { PropsWithChildren, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Game } from "./Game";
import reportWebVitals from "./reportWebVitals";
import {
  createBrowserRouter,
  RouterProvider,
  useNavigate,
} from "react-router-dom";
import { Login, useUser } from "./Login";
import { Register } from "./Register";
import { Menu } from "./Menu";

const LoginRedirect = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();
  const { user } = useUser();
  useEffect(() => {
    if (!user) navigate("/login");
  }, []);
  return <>{children}</>;
};

const User = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  return (
    <div>
      <h1>Hello, {user?.name}!</h1>
      <h2>
        Your user id is {user.id}. Store this if you want to preserve this
        account.
      </h2>
      <h3>Your session is saved in browser.</h3>
      <button onClick={() => navigate("/")}>OK</button>
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <LoginRedirect>
        <Menu />
      </LoginRedirect>
    ),
  },
  {
    path: "/user",
    element: (
      <LoginRedirect>
        <User />
      </LoginRedirect>
    ),
  },
  {
    path: "/game",
    element: (
      <LoginRedirect>
        <Game />
      </LoginRedirect>
    ),
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  //<React.StrictMode>
  <RouterProvider router={router} />
  //</React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
