import type { Application } from "express";
import supertest from "supertest";
import { expect } from "vitest";

export async function login(app: Application) {
    // Obtain auth token.
    const response = await supertest(app)
        .post("/etapi/auth/login")
        .send({
            "password": "demo1234"
        })
        .expect(201);
    const token = response.body.authToken;
    expect(token).toBeTruthy();
}
