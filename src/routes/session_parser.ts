import session from "express-session";
import sessionFileStore from "session-file-store";
import sessionSecret from "../services/session_secret.js";
import dataDir from "../services/data_dir.js";
import config from "../services/config.js";
import totp from "../services/totp.js";
import open_id from "../services/open_id.js";
import type { Request, Response, NextFunction } from "express";

const FileStore = sessionFileStore(session);

const sessionParser = session({
    secret: sessionSecret,
    resave: false, // true forces the session to be saved back to the session store, even if the session was never modified during the request.
    saveUninitialized: false, // true forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified.
    cookie: {
        path: config.Session.cookiePath,
        httpOnly: true,
        maxAge: config.Session.cookieMaxAge * 1000 // needs value in milliseconds
    },
    name: "trilium.sid",
    store: new FileStore({
        ttl: config.Session.cookieMaxAge,
        path: `${dataDir.TRILIUM_DATA_DIR}/sessions`
    })
});

const checkAuthState = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.loggedIn || req.path === '/login') {
        return next();
    }

    const currentTotpStatus = totp.isTotpEnabled();
    const currentSsoStatus = open_id.isOpenIDEnabled();

    const lastAuthState = req.session.lastAuthState || {
        totpEnabled: false,
        ssoEnabled: false
    };

    if (lastAuthState.totpEnabled !== currentTotpStatus ||
        lastAuthState.ssoEnabled !== currentSsoStatus) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            res.redirect('/login');
        });
        return;
    }

    next();
};

export default function (req: Request, res: Response, next: NextFunction) {
    sessionParser(req, res, () => {
        checkAuthState(req, res, next);
    });
}
