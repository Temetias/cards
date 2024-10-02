import React from "react";
import { useUser } from "./Login";

export function Register() {
  const { login } = useUser();

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleRegister = () => {
    if (!inputRef.current) return;
    const name = inputRef.current.value;
    if (!name) return;
    fetch("http://localhost:8000/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    }).then((res) => {
      res.json().then((user) => {
        login(user, "/user");
      });
    });
  };

  return (
    <form>
      <label htmlFor="username">
        Username
        <input id="username" ref={inputRef} />
        <button
          onClick={(e) => {
            e.preventDefault();
            handleRegister();
          }}
        >
          Register
        </button>
      </label>
    </form>
  );
}
