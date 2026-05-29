const STORAGE_KEY = 'vuphong_remembered_login';

export function readRememberedLogin() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.username) return null;
    return {
      username: data.username,
      password: data.password ? atob(data.password) : '',
    };
  } catch {
    return null;
  }
}

export function saveRememberedLogin(username, password) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        username,
        password: password ? btoa(password) : '',
      }),
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearRememberedLogin() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
