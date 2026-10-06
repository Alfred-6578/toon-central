// Cookie the mock sign-in sets so server-rendered pages (the reader) can see who's "signed in".
// Demo only: a real session must be a signed, httpOnly cookie issued and verified by the server.
// This one is written by the browser, so anyone could set it.
export const SESSION_COOKIE = "tc-mock-signed-in";
