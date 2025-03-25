import totp from "../services/totp.js";
import open_id from "../services/open_id.js";
import type { Request, Response, NextFunction } from "express";


export default function checkAuthState(req: Request, res: Response, next: NextFunction) {
    if (!req.session.loggedIn || req.path === '/login') return next();

    const currentTotpStatus = totp.isTotpEnabled();
    const currentSsoStatus = open_id.isOpenIDEnabled();
    const lastAuthState = req.session.lastAuthState || { totpEnabled: false, ssoEnabled: false };

    if (lastAuthState.totpEnabled !== currentTotpStatus ||
        lastAuthState.ssoEnabled !== currentSsoStatus) {
        req.session.destroy((err) => {
            if (err) console.error('Error destroying session:', err);

            if (typeof res.redirect === 'function') {
                res.redirect('/login');
            } else {
                console.warn("res.redirect unavailable");
                res.end?.();
            }
        });
        return;
    }

    next();
}
