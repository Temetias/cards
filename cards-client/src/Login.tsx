import React from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@cards/shared";

export function useUser() {
  const storedUser = localStorage.getItem("user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const navigate = useNavigate();
  if (!parsedUser) navigate("/login");

  const [user, setUser] = React.useState<User | null>(parsedUser);

  const login = (user: User, destination?: string) => {
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    navigate(destination || "/");
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return { user: user as User, login, logout };
}

export function Login() {
  const { login } = useUser();
  const navigate = useNavigate();

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleLogin = () => {
    if (!inputRef.current) return;
    const id = inputRef.current.value;
    if (!id) return;
    fetch("http://localhost:8000/user/" + id).then((res) => {
      res.json().then(login);
    });
  };

  return (
    <form>
      <label htmlFor="username">
        User ID
        <input id="username" ref={inputRef} />
        <button
          onClick={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          Login
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            navigate("/register");
          }}
        >
          Register
        </button>
      </label>
    </form>
  );
}
