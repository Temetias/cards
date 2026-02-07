import { createContext, useContext, useState } from "react";
import "./LoadingOverlayContext.css";

type LoadingOverlayContextValue = {
  show: boolean;
  message: string;
  percentage: number | null;
  setpercentage: (percentage: number | null) => void;
  setMessage: (message: string) => void;
  setShow: (show: boolean) => void;
};

const LoadingOverlayContext = createContext<LoadingOverlayContextValue | null>(
  null,
);

export function LoadingOverlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [percentage, setPercentage] = useState<number | null>(null);

  return (
    <LoadingOverlayContext.Provider
      value={{
        show,
        message,
        percentage,
        setpercentage: setPercentage,
        setMessage,
        setShow,
      }}
    >
      {children}
      {show && (
        <div className="LoadingOverlay">
          <h2>{message}</h2>
          {percentage !== null && (
            <div className="LoadingOverlay-ProgressBar">
              <div
                className="LoadingOverlay-ProgressBar-Fill"
                style={{
                  width: percentage !== null ? `${percentage}%` : "100%",
                }}
              />
            </div>
          )}
        </div>
      )}
    </LoadingOverlayContext.Provider>
  );
}

export function useLoadingOverlay() {
  const context = useContext(LoadingOverlayContext);
  if (!context) {
    throw new Error(
      "useLoadingOverlay must be used within LoadingOverlayProvider",
    );
  }
  return context;
}
