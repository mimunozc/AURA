import { v4 as uuidv4 } from "uuid";

const USER_ID_KEY = "aura_user_id";
const CONTEXT_ID_KEY = "aura_context_id";

export function getUserId(): string {
  if (typeof window === "undefined") return "demo-user";
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = `aura-${uuidv4()}`;
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function getContextId(): string {
  if (typeof window === "undefined") return "conv-demo";
  let id = localStorage.getItem(CONTEXT_ID_KEY);
  if (!id) {
    id = "conv-demo"; // el mismo que crea el seed del backend
    localStorage.setItem(CONTEXT_ID_KEY, id);
  }
  return id;
}
