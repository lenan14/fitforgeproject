"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // [Auto-Login] \\
  useEffect(() => {
    const savedUser = localStorage.getItem("username");

    if (savedUser) {
      router.push("/feed");
    }
  }, [router]);

  // [Login] \\
  const handleLogin = () => {
    const users = JSON.parse(localStorage.getItem("users") || "{}");

    if (!users[username]) {
      alert("Account doesn't exists")
      return;
    }

    if (users[username] !== password) {
      alert("Incorrect password.");
      return;
    }

    localStorage.setItem("username", username);

    router.push("/feed")
  };

  // [Create Account] \\
  const handleCreate = () => {
    const users = JSON.parse(localStorage.getItem("users") || "{}");

    if (users[username]) {
      alert("Username already exists.");
      return;
    }

    users[username] = password;

    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("username", username);

    router.push("/feed");
  };

  return (
    <div className="Intro-Container">

      {/* [Introduction] */}
      <h1 className="Intro-Title">Welcome to Fit Forge</h1>

      <p className="Intro-Description">
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut 
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
        nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit 
        esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, 
        sunt in culpa qui officia deserunt mollit anim id est laborum."
      </p>

      {/* Autehntication */}
      <div className="Authen-Container">

        <h2 className="Authen-Title">Welcome to the Playground</h2>

        <p className="Authen-Description">
          Login or Create an Account.
        </p>

        <br /><br />

        <input
          type="password" 
          className="Authen-Input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br /><br />

        <button className="Authen-Btn" onClick={handleCreate}>Regiter</button>

      </div>
    </div>
  )
}