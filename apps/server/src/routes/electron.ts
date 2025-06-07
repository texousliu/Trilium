import electron from "electron";
import type { Application } from "express";
import type { ParamsDictionary, Request, Response } from "express-serve-static-core";
import type QueryString from "qs";
import { Session, SessionData } from "express-session";

type MockedResponse = Response<any, Record<string, any>, number>;

function init(app: Application) {
    const fakeSession: Session & Partial<SessionData> = {
        id: "session-id", // Placeholder for session ID
        cookie: {
            originalMaxAge: 3600000, // 1 hour
        },
        loggedIn: true,
        regenerate(callback) {
            callback?.(null);
            return fakeSession;
        },
        destroy(callback) {
            callback?.(null);
            return fakeSession;
        },
        reload(callback) {
            callback?.(null);
            return fakeSession;
        },
        save(callback) {
            callback?.(null);
            return fakeSession;
        },
        resetMaxAge: () => fakeSession,
        touch: () => fakeSession
    };

    electron.ipcMain.on("server-request", (event, arg) => {
        const req: Pick<Request<ParamsDictionary, any, any, QueryString.ParsedQs, Record<string, any>>, "url" | "method" | "body" | "headers" | "session"> = {
            url: arg.url,
            method: arg.method,
            body: arg.data,
            headers: arg.headers,
            session: fakeSession
        };

        const respHeaders: Record<string, string | string[]> = {};

        const res: Pick<Response<any, Record<string, any>, number>, "statusCode" | "getHeader" | "setHeader" | "header" | "status" | "send" | "locals" | "json"> = {
            statusCode: 200,
            getHeader: (name) => respHeaders[name],
            setHeader: (name, value) => {
                respHeaders[name] = value.toString();
                return res as MockedResponse;
            },
            header(name: string, value?: string | string[]) {
                respHeaders[name] = value ?? "";
                return res as MockedResponse;
            },
            status: (statusCode) => {
                res.statusCode = statusCode;
                return res as MockedResponse;
            },
            send: (obj) => {
                event.sender.send("server-response", {
                    url: arg.url,
                    method: arg.method,
                    requestId: arg.requestId,
                    statusCode: res.statusCode,
                    headers: respHeaders,
                    body: obj
                });
                return res as MockedResponse;
            },
            locals: {},
            json: (obj) => {
                res.send(JSON.stringify(obj));
                return res as MockedResponse;
            }
        };

        return app.router(req as any, res as any, () => {});
    });
}

export default init;
