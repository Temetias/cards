import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { UserData } from "../../shared/user.ts";
import { type Nullable } from "../../shared/utils.ts";

export function useUser(): Nullable<UserData> {
  const userJson = localStorage.getItem("user");
  if (!userJson) return null;
  return JSON.parse(userJson);
}

function Register() {
  const navigate = useNavigate();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const username = formData.get("username") as string;
        const password = formData.get("password") as string;
        const name = formData.get("name") as string;
        fetch("/api/user/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password, name }),
        })
          .then((res) => res.json())
          .then((user: UserData) => {
            localStorage.setItem("user", JSON.stringify(user));
            navigate("/");
          });
      }}
    >
      <h2>Register</h2>
      <label>
        Username:
        <input type="text" name="username" required />
      </label>
      <label>
        Display name:
        <input type="text" name="name" required />
      </label>
      <label>
        Password:
        <input type="password" name="password" required />
      </label>
      <button type="submit">Register</button>
    </form>
  );
}

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const location = (globalThis as unknown as { location: Location }).location;
    if (!location.hash.startsWith("#discord=")) return;
    const encoded = location.hash.replace("#discord=", "");
    try {
      const json = decodeURIComponent(
        escape(atob(decodeURIComponent(encoded))),
      );
      const user = JSON.parse(json) as UserData;
      localStorage.setItem("user", JSON.stringify(user));
      location.hash = "";
      navigate("/");
    } catch {
      // ignore malformed payload
    }
  }, [navigate]);

  return (
    <div>
      <h1>v2cards</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const username = formData.get("username") as string;
          const password = formData.get("password") as string;
          fetch("/api/user/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
          })
            .then((res) => {
              if (!res.ok) {
                throw new Error("Login failed");
              }
              return res.json();
            })
            .then((user: UserData) => {
              localStorage.setItem("user", JSON.stringify(user));
              navigate("/");
            })
            .catch(() => {
              alert("Login failed.");
            });
        }}
      >
        <h2>Login</h2>
        <label>
          Username:
          <input type="text" name="username" required />
        </label>
        <label>
          Password:
          <input type="password" name="password" required />
        </label>
        <button type="submit">Login</button>
      </form>
      <a href="/api/user/login/discord/start">
        <button type="button">Login with Discord</button>
      </a>
      <Register />
    </div>
  );
}
