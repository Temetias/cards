import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../context/UserContext.tsx";

function Register() {
  const navigate = useNavigate();
  const { refresh } = useUserContext();
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
          .then(() => refresh())
          .then(() => {
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
  const { refresh } = useUserContext();

  useEffect(() => {
    const location = (globalThis as unknown as { location: Location }).location;
    if (!location.hash.startsWith("#discord=")) return;
    location.hash = "";
    refresh().finally(() => {
      navigate("/");
    });
  }, [navigate, refresh]);

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
            .then(() => refresh())
            .then(() => {
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
