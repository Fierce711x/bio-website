import { api } from "../../lib/axios/api";
import { Axios, AxiosError } from "axios";
import type { SignupData, LoginData } from "../types/authTypes";
import { parseError, parseWebSocketError } from "../../lib/axios/apiError";
import { AuthState } from "../types/contextTypes";
import { refreshConnection } from "../../lib/react-query/queryClient";

class AuthApi {
  private refreshPromise: Promise<void> | null = null;

  constructor(private readonly api: Axios) {}

  async signup(signupData: SignupData) {
    return this.api.post("/auth/signup", signupData);
  }
  async login(loginData: LoginData) {
    return this.api.post("/auth/login", loginData);
  }
  async logout() {
    return this.api.post("/auth/logout");
  }

  async getCurrentUser() {
    return this.api.get("/auth/me");
  }

  async refresh() {
    if (!this.refreshPromise) {
      this.refreshPromise = new Promise((res, rej) => {
        this.api
          .post("/auth/refresh")
          .then(() => {
            this.refreshPromise = null;
            res();
          })
          .catch(err => {
            this.refreshPromise = null;
            rej(err);
          })
          .finally(() => {
            this.refreshPromise = null;
          });
      });
    }
    return this.refreshPromise;
  }
}
export const authApi = new AuthApi(api);

api.interceptors.response.use(
  res => res,
  async (err: AxiosError) => {
    const originalRequest = err.config;
    const apiError = parseError(err);

    if (!originalRequest) throw apiError;

    if (apiError.status !== 500 && apiError.status !== 401) throw apiError;

    if (originalRequest.url === "/auth/refresh" && apiError.status === 401) throw apiError;
    if (originalRequest._retry) throw apiError;

    originalRequest._retry = true;

    if (originalRequest.url === "/auth/refresh" && apiError.status === 500) {
      return api(originalRequest);
    }
    await authApi.refresh();
    return api(originalRequest);
  },
);

api.interceptors.response.use(
  res => res,
  err => {
    throw parseError(err);
  },
);

type Connection = { socket: WebSocket | null; connectionId: string | null };
export const connectWS = (() => {
  const connection: Connection = { socket: null, connectionId: null };
  let connectionPromise: Promise<boolean> | null = null;
  let connectionTimeout: number | null = null;
  const initWS = () => {
    if (connection.socket) return Promise.resolve(true);
    if (!connectionPromise) {
      let authorized: boolean = false;
      connectionPromise = new Promise<boolean>((res, rej) => {
        const ws = new WebSocket("ws://localhost:3000/connect");
        connectionTimeout = setTimeout(() => {
          connectionTimeout = null;
          ws.close(4005, "aborted");
          res(false);
        }, 1000);
        ws.onmessage = event => {
          const message = JSON.parse(event.data);
          if (message.event === "session-authorized") {
            connection.socket = ws;
            connection.connectionId = message.data.connectionId;
            authorized = true;
            if (connectionPromise) res(true);
          } else if (message && typeof message === "object" && "event" in message && message.event === "error") {
            throw parseWebSocketError(message);
          }
        };
        ws.onclose = async function (event) {
          this.onmessage = null;
          this.onclose = null;
          this.onerror = null;
          if (ws === connection.socket) {
            connection.socket = null;
            connection.connectionId = null;
          }
          if (event.code === 4003) rej(new Error("duplicate"));
          if (connectionPromise) res(false);
          if (authorized) {
            authorized = false;
            refreshConnection();
          }
        };
        ws.onerror = () => {
          res(false);
        };
      }).finally(() => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        connectionPromise = null;
      });
    }
    return connectionPromise;
  };
  api.interceptors.request.use(
    req => {
      if (connection.connectionId) req.headers.set("x-connection-id", connection.connectionId);
      else req.headers.delete("x-connection-id");
      return req;
    },
    err => {
      throw parseError(err);
    },
  );
  return {
    initWS,
  };
})();

export async function connect(): Promise<AuthState> {
  try {
    const connected = await connectWS.initWS();
    if (connected) return AuthState.Authenticated;
    await authApi.refresh();
    return (await connectWS.initWS()) ? AuthState.Authenticated : AuthState.UnAuthenticate;
  } catch {
    return AuthState.UnAuthenticate;
  }
}
