import type { NextFunction, Request, Response } from "express";
import openIDEncryption from "./encryption/open_id_encryption.js";
import sqlInit from "./sql_init.js";
import options from "./options.js";
import type { Session } from "express-openid-connect";
import sql from "./sql.js";
import config from "./config.js";
import log from "./log.js";

/**
 * Type definition for OIDC user claims
 * These may not all be present depending on the provider configuration
 */
interface OIDCUserClaims {
    sub?: string | number | undefined;  // Subject identifier (required in OIDC spec but may be missing)
    name?: string | undefined;           // Full name
    given_name?: string | undefined;     // First name
    family_name?: string | undefined;    // Last name
    preferred_username?: string | undefined;  // Username
    email?: string | undefined;          // Email address
    email_verified?: boolean | undefined;
    [key: string]: unknown;              // Allow additional claims
}

/**
 * Type guard to check if a value is a non-empty string
 */
function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Safely converts a value to string with fallback
 */
function safeToString(value: unknown, fallback = ''): string {
    if (value === null || value === undefined) {
        return fallback;
    }
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return fallback;
        }
    }
    return fallback;
}

/**
 * Extracts and validates user information from OIDC claims
 */
function extractUserInfo(user: OIDCUserClaims): {
    sub: string;
    name: string;
    email: string;
} | null {
    // Extract subject identifier (required)
    const sub = safeToString(user.sub);
    if (!isNonEmptyString(sub)) {
        log.error(`OAuth: Missing or invalid subject identifier in user claims: ${JSON.stringify(user)}`);
        return null;
    }

    // Extract name with multiple fallback strategies
    let name = '';
    
    // Try direct name field
    if (isNonEmptyString(user.name)) {
        name = user.name;
    } 
    // Try concatenating given_name and family_name
    else if (isNonEmptyString(user.given_name) || isNonEmptyString(user.family_name)) {
        const parts: string[] = [];
        if (isNonEmptyString(user.given_name)) parts.push(user.given_name);
        if (isNonEmptyString(user.family_name)) parts.push(user.family_name);
        name = parts.join(' ');
    }
    // Try preferred_username
    else if (isNonEmptyString(user.preferred_username)) {
        name = user.preferred_username;
    }
    // Try email username part
    else if (isNonEmptyString(user.email)) {
        const emailParts = user.email.split('@');
        if (emailParts.length > 0 && emailParts[0]) {
            name = emailParts[0];
        }
    }
    
    // Final fallback to subject identifier
    if (!isNonEmptyString(name)) {
        name = `User-${sub.substring(0, 8)}`;
        log.info(`OAuth: No name found in claims, using fallback: ${name}`);
    }

    // Extract email with fallback
    let email = '';
    if (isNonEmptyString(user.email)) {
        email = user.email;
    } else {
        // Generate a placeholder email if none provided
        email = `${sub}@oauth.local`;
        log.info(`OAuth: No email found in claims, using placeholder: ${email}`);
    }

    return { sub, name, email };
}

function checkOpenIDConfig() {
    const missingVars: string[] = []
    if (config.MultiFactorAuthentication.oauthBaseUrl === "") {
        missingVars.push("oauthBaseUrl");
    }
    if (config.MultiFactorAuthentication.oauthClientId === "") {
        missingVars.push("oauthClientId");
    }
    if (config.MultiFactorAuthentication.oauthClientSecret === "") {
        missingVars.push("oauthClientSecret");
    }
    return missingVars;
}

function isOpenIDEnabled() {
    return !(checkOpenIDConfig().length > 0) && options.getOptionOrNull('mfaMethod') === 'oauth';
}

function isUserSaved() {
    const data = sql.getValue<string>("SELECT isSetup FROM user_data;");
    return data === "true" ? true : false;
}

function getUsername() {
    const username = sql.getValue<string>("SELECT username FROM user_data;");
    return username;
}

function getUserEmail() {
    const email = sql.getValue<string>("SELECT email FROM user_data;");
    return email;
}

function clearSavedUser() {
    sql.execute("DELETE FROM user_data");
    options.setOption("userSubjectIdentifierSaved", false);
    return {
        success: true,
        message: "Account data removed."
    };
}

function getOAuthStatus() {
    return {
        success: true,
        name: getUsername(),
        email: getUserEmail(),
        enabled: isOpenIDEnabled(),
        missingVars: checkOpenIDConfig()
    };
}

function isTokenValid(req: Request, res: Response, next: NextFunction) {
    const userStatus = openIDEncryption.isSubjectIdentifierSaved();

    if (req.oidc !== undefined) {
        const result = req.oidc
            .fetchUserInfo()
            .then((result) => {
                return {
                    success: true,
                    message: "Token is valid",
                    user: userStatus,
                };
            })
            .catch((result) => {
                return {
                    success: false,
                    message: "Token is not valid",
                    user: userStatus,
                };
            });
        return result;
    } else {
        return {
            success: false,
            message: "Token not set up",
            user: userStatus,
        };
    }
}

function getSSOIssuerName() {
    return config.MultiFactorAuthentication.oauthIssuerName;
}

function getSSOIssuerIcon() {
    return config.MultiFactorAuthentication.oauthIssuerIcon;
}

function generateOAuthConfig() {
    const authRoutes = {
        callback: "/callback",
        login: "/authenticate",
        postLogoutRedirect: "/login",
        logout: "/logout",
    };

    const logoutParams = {
    };

    const authConfig = {
        authRequired: false,
        auth0Logout: false,
        baseURL: config.MultiFactorAuthentication.oauthBaseUrl,
        clientID: config.MultiFactorAuthentication.oauthClientId,
        issuerBaseURL: config.MultiFactorAuthentication.oauthIssuerBaseUrl,
        secret: config.MultiFactorAuthentication.oauthClientSecret,
        clientSecret: config.MultiFactorAuthentication.oauthClientSecret,
        authorizationParams: {
            response_type: "code",
            scope: "openid profile email",
            access_type: "offline",
            prompt: "consent",
            state: "random_state_" + Math.random().toString(36).substring(2)
        },
        routes: authRoutes,
        idpLogout: true,
        logoutParams: logoutParams,
        afterCallback: async (req: Request, res: Response, session: Session) => {
            try {
                // Check if database is initialized
                if (!sqlInit.isDbInitialized()) {
                    log.info("OAuth callback: Database not initialized yet, skipping user save");
                    return session;
                }

                // Check if user object exists
                if (!req.oidc?.user) {
                    log.error("OAuth callback: No user object received from OIDC provider");
                    return session;
                }

                const user = req.oidc.user as OIDCUserClaims;
                
                // Log received claims for debugging (sanitize sensitive data)
                const sanitizedClaims = {
                    sub: user.sub ? '***' : undefined,
                    name: user.name,
                    given_name: user.given_name,
                    family_name: user.family_name,
                    preferred_username: user.preferred_username,
                    email: user.email ? user.email.replace(/^(.{2}).*@/, '$1***@') : undefined,
                    email_verified: user.email_verified,
                    claim_keys: Object.keys(user)
                };
                log.info(`OAuth callback: Received user claims: ${JSON.stringify(sanitizedClaims)}`);

                // Extract and validate user information
                const userInfo = extractUserInfo(user);
                
                if (!userInfo) {
                    log.error("OAuth callback: Failed to extract valid user information from claims");
                    // Still return session to avoid breaking the auth flow
                    // The user won't be saved but the OAuth flow can complete
                    return session;
                }

                // Attempt to save user with validated information
                log.info(`OAuth callback: Saving user - name: "${userInfo.name}", email: "${userInfo.email}"`);
                
                const saveResult = openIDEncryption.saveUser(
                    userInfo.sub,
                    userInfo.name,
                    userInfo.email
                );

                if (saveResult === false) {
                    log.info("OAuth callback: User already saved, skipping");
                } else if (saveResult === undefined) {
                    log.error("OAuth callback: Failed to save user (encryption key issue)");
                    // Continue anyway as the OAuth flow succeeded
                } else {
                    log.info("OAuth callback: User successfully saved");
                }

                // Set session variables for successful authentication
                req.session.loggedIn = true;
                req.session.lastAuthState = {
                    totpEnabled: false,
                    ssoEnabled: true
                };

                log.info("OAuth callback: Authentication successful, session established");

            } catch (error) {
                // Log the error but don't throw - we want to complete the OAuth flow
                log.error(`OAuth callback: Unexpected error during user processing: ${error instanceof Error ? error.message : String(error)}`);
                
                // Log stack trace for debugging
                if (error instanceof Error && error.stack) {
                    log.error(`OAuth callback: Stack trace: ${error.stack}`);
                }
                
                // Still try to set session if possible
                try {
                    req.session.loggedIn = true;
                    req.session.lastAuthState = {
                        totpEnabled: false,
                        ssoEnabled: true
                    };
                } catch (sessionError) {
                    log.error(`OAuth callback: Failed to set session: ${sessionError}`);
                }
            }

            return session;
        },
    };
    return authConfig;
}

export default {
    generateOAuthConfig,
    getOAuthStatus,
    getSSOIssuerName,
    getSSOIssuerIcon,
    isOpenIDEnabled,
    clearSavedUser,
    isTokenValid,
    isUserSaved,
};
