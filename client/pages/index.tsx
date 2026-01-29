import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Index() {
  return (
    <main id="content">
      <h1>v2cards</h1>
      <Link to="/game">
        <button>Find Match</button>
      </Link>
    </main>
  );
}
