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

// 创建一个检查认证状态的中间件
const checkAuthState = (req: Request, res: Response, next: NextFunction) => {
    // 如果用户未登录或者是登录页面，直接继续
    if (!req.session.loggedIn || req.path === '/login') {
        return next();
    }

    const currentTotpStatus = totp.isTotpEnabled();
    const currentSsoStatus = open_id.isOpenIDEnabled();

    // 从 session 中获取上次登录时的认证状态
    const lastAuthState = req.session.lastAuthState || {
        totpEnabled: false,
        ssoEnabled: false
    };

    // 检查认证状态是否发生变化
    if (lastAuthState.totpEnabled !== currentTotpStatus ||
        lastAuthState.ssoEnabled !== currentSsoStatus) {
        // 如果认证状态发生变化，先销毁当前 session
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            // 清除 cookie
            res.clearCookie('trilium.sid');
            // 重定向到登录页面
            res.redirect('/login');
        });
        return;
    }

    next();
};

// 导出一个组合的中间件
export default function (req: Request, res: Response, next: NextFunction) {
    sessionParser(req, res, () => {
        checkAuthState(req, res, next);
    });
}
