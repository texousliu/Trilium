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
    }

    // Extract email with fallback
    let email = '';
    if (isNonEmptyString(user.email)) {
        email = user.email;
    } else {
        // Generate a placeholder email if none provided
        email = `${sub}@oauth.local`;
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

    // No need to log configuration details - users can check their environment variables
    // The connectivity test will verify if everything is working

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
        // Add error handling for required auth failures
        errorOnRequiredAuth: true,
        // Enable detailed error messages
        enableTelemetry: false,
        // Handle OAuth callback errors
        handleCallback: async (req: Request, res: Response, next: NextFunction) => {
            try {
                // Only log if there's an error from the OAuth provider
                if (req.query.error) {
                    log.error(`OAuth: Provider returned error: ${req.query.error}`);
                    if (req.query.error_description) {
                        log.error(`OAuth: Error description: ${req.query.error_description}`);
                    }
                }
                // No need to log successful callbacks - if it works, it works
                // The library will handle the actual callback
                return undefined;
            } catch (error) {
                log.error(`OAuth: Callback error: ${error instanceof Error ? error.message : String(error)}`);
                throw error;
            }
        },
        afterCallback: async (req: Request, res: Response, session: Session) => {
            try {
                // Check if database is initialized
                if (!sqlInit.isDbInitialized()) {
                    return session;
                }

                // Check if user object exists
                if (!req.oidc?.user) {
                    log.error("OAuth callback: No user object received from OIDC provider");
                    return session;
                }

                const user = req.oidc.user as OIDCUserClaims;
                
                // No need to log user claims - if we got here, authentication worked

                // Extract and validate user information
                const userInfo = extractUserInfo(user);
                
                if (!userInfo) {
                    log.error("OAuth callback: Failed to extract valid user information from claims");
                    // Still return session to avoid breaking the auth flow
                    return session;
                }

                // Save user (no need to log - this is internal operation)
                openIDEncryption.saveUser(
                    userInfo.sub,
                    userInfo.name,
                    userInfo.email
                );

                // Set session variables for successful authentication
                req.session.loggedIn = true;
                req.session.lastAuthState = {
                    totpEnabled: false,
                    ssoEnabled: true
                };
                
                // Success - no need to log, user is logged in

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

/**
 * Middleware to log OAuth errors
 */
function oauthErrorLogger(err: any, req: Request, res: Response, next: NextFunction) {
    if (err) {
        // Always log the basic error
        log.error(`OAuth Error: ${err.message || 'Unknown error'}`);
        
        // Log OAuth-specific error details (these are from the provider, safe to log)
        if (err.error) {
            log.error(`OAuth Error Type: ${err.error}`);
        }
        if (err.error_description) {
            log.error(`OAuth Error Description: ${err.error_description}`);
        }
        
        // Provide helpful error messages based on error type
        if (err.message?.includes('getaddrinfo') || err.message?.includes('ENOTFOUND')) {
            log.error('Network Error: Cannot reach OAuth provider. Check network connectivity and DNS resolution.');
        } else if (err.message?.includes('invalid_client')) {
            log.error('Authentication Error: Invalid client credentials. Verify your OAuth client ID and secret.');
        } else if (err.message?.includes('invalid_grant')) {
            log.error('Token Error: Authorization code is invalid or expired. This can happen if the callback takes too long.');
        } else if (err.message?.includes('self signed certificate') || err.message?.includes('certificate')) {
            log.error('Certificate Error: SSL/TLS certificate verification failed.');
            log.error('For testing with self-signed certificates, consult your OAuth provider documentation.');
        } else if (err.message?.includes('timeout')) {
            log.error('Timeout Error: Request to OAuth provider timed out. Check network latency and firewall rules.');
        }
    }
    
    // Pass the error to the next error handler
    next(err);
}

/**
 * Helper function to test OAuth connectivity
 * Useful for debugging network issues between containers
 */
async function testOAuthConnectivity(): Promise<{success: boolean, error?: string}> {
    const issuerUrl = config.MultiFactorAuthentication.oauthIssuerBaseUrl;
    
    if (!issuerUrl) {
        return { success: false, error: 'No issuer URL configured' };
    }
    
    try {
        log.info(`Testing OAuth connectivity to: ${issuerUrl}`);
        
        // Try to fetch the OpenID configuration
        const configUrl = issuerUrl.endsWith('/') 
            ? `${issuerUrl}.well-known/openid-configuration`
            : `${issuerUrl}/.well-known/openid-configuration`;
            
        const response = await fetch(configUrl);
        
        if (response.ok) {
            log.info('OAuth connectivity test successful');
            const config = await response.json();
            log.info(`OAuth provider endpoints discovered: token=${config.token_endpoint ? 'yes' : 'no'}, userinfo=${config.userinfo_endpoint ? 'yes' : 'no'}`);
            return { success: true };
        } else {
            const error = `OAuth provider returned status ${response.status}`;
            log.error(`OAuth connectivity test failed: ${error}`);
            return { success: false, error };
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        log.error(`OAuth connectivity test failed: ${errorMsg}`);
        return { success: false, error: errorMsg };
    }
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
    oauthErrorLogger,
    testOAuthConnectivity,
};
