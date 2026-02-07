import { Link } from "react-router-dom";
import { useAssetPreloader } from "../hooks/useAssetPreloader.ts";
import { useLoadingOverlay } from "../context/LoadingOverlayContext/LoadingOverlayContext.tsx";
import { useEffect } from "react";

export default function Index() {
  const { isDone, loadedCount, progressPercentage, total } =
    useAssetPreloader();
  const { setShow, setMessage, setpercentage } = useLoadingOverlay();
  useEffect(() => {
    setShow(!isDone);
    setMessage("Loading assets...");
    setpercentage(progressPercentage);
  }, [isDone, loadedCount, total, setMessage, setShow, setpercentage]);
  return isDone ? (
    <main id="content">
      <h1>v2cards</h1>
      <Link to="/game">
        <button type="button">Find Match</button>
      </Link>
      <Link to="/decks">
        <button type="button">My decks</button>
      </Link>
      <Link to="/logout">
        <button type="button">Logout</button>
      </Link>
    </main>
  ) : null;
}
