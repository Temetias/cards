import { Link } from "react-router-dom";

export default function Index() {
  return (
    <main id="content">
      <h1>v2cards</h1>
      <Link to="/game">
        <button type="button">Find Match</button>
      </Link>
      <Link to="/logout">
        <button type="button">Logout</button>
      </Link>
    </main>
  );
}
