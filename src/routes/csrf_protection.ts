import { doubleCsrf } from "csrf-csrf";
import sessionSecret from "../services/session_secret.js";

const doubleCsrfUtilities = doubleCsrf({
    getSecret: () => sessionSecret,
    cookieOptions: {
        path: "", // empty, so cookie is valid only for the current path
        secure: false,
        sameSite: "strict",
        httpOnly: true
    },
    cookieName: "_csrf"
});

export const { generateToken, doubleCsrfProtection } = doubleCsrfUtilities;
