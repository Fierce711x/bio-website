import { useContext } from "react";
import { WSContext } from "../context/authContext";
export function useWs() {
  const context = useContext(WSContext);
  if (!context) throw new Error("useWs must be used inside WSContext");
  return context;
}
