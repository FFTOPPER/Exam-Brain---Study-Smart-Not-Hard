interface SessionData {
  text: string;
  fileCount: number;
  createdAt: number;
}

const store = new Map<string, SessionData>();

const TTL_MS = 2 * 60 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  for (const [key, val] of store.entries()) {
    if (now - val.createdAt > TTL_MS) {
      store.delete(key);
    }
  }
}

setInterval(cleanup, 30 * 60 * 1000).unref();

export const sessionStore = store;
