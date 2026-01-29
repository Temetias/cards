import { useNavigate } from "react-router-dom";
import type { UserData } from "../../shared/user.ts";
import { type Nullable } from "../../shared/utils.ts";
import { useCallback } from "react";

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
        const name = formData.get("name") as string;
        fetch("/api/user/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
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
        Name:
        <input type="text" name="name" required />
      </label>
      <button type="submit">Register</button>
    </form>
  );
}

export default function Login() {
  const user = useUser();
  const navigate = useNavigate();
  const handleLogin = useCallback(() => {
    if (!user) return;
    fetch("/api/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    }).then((res) => {
      if (res.ok) {
        navigate("/");
      } else {
        alert("Login failed.");
      }
    });
  }, [user, navigate]);
  return (
    <div>
      <h1>v2cards</h1>
      {user ? (
        <button type="submit" onClick={handleLogin}>
          Login
        </button>
      ) : (
        <Register />
      )}
    </div>
  );
}
