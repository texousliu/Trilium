import sql from "../services/sql.js";
import session, { Store } from "express-session";
import sessionSecret from "../services/session_secret.js";
import config from "../services/config.js";

class SQLiteSessionStore extends Store {

    get(sid: string, callback: (err: any, session?: session.SessionData | null) => void): void {
        return callback(null);
    }

    set(id: string, session: session.SessionData, callback?: (err?: any) => void): void {
        const expires = Date.now() + 3600000; // Session expiration time (1 hour from now)
        const data = JSON.stringify(session);

        sql.upsert("sessions", "id", {
            id,
            expires,
            data
        });
        callback?.();
    }

    destroy(sid: string, callback?: (err?: any) => void): void {
        console.log("Destroy ", sid);
        sql.execute(/*sql*/`DELETE FROM sessions WHERE id = ?`, sid);
        callback?.();
    }

}

const sessionParser = session({
    secret: sessionSecret,
    resave: false, // true forces the session to be saved back to the session store, even if the session was never modified during the request.
    saveUninitialized: false, // true forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified.
    cookie: {
        path: "/",
        httpOnly: true,
        maxAge: config.Session.cookieMaxAge * 1000 // needs value in milliseconds
    },
    name: "trilium.sid",
    store: new SQLiteSessionStore()
});

export default sessionParser;
