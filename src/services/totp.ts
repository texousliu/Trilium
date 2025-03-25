import { Totp } from 'time2fa';
import config from './config.js';
import MFAError from '../errors/mfa_error.js';


function isTotpEnabled() {
    if (config.MultiFactorAuthentication.totpEnabled && config.MultiFactorAuthentication.totpSecret === "") {
        throw new MFAError("TOTP secret is not set!");
    }
    return config.MultiFactorAuthentication.totpEnabled;
}

function getTotpSecret() {
    return config.MultiFactorAuthentication.totpSecret;
}

function checkForTotSecret() {
    return config.MultiFactorAuthentication.totpSecret === "" ? false : true;
}

function validateTOTP(submittedPasscode: string) {
    if (config.MultiFactorAuthentication.totpSecret === "") return false;

    try {
        const valid = Totp.validate({
            passcode: submittedPasscode,
            secret: config.MultiFactorAuthentication.totpSecret.trim()
        });
        return valid;
    } catch (e) {
        return false;
    }
}

export default {
    isTotpEnabled,
    getTotpSecret,
    checkForTotSecret,
    validateTOTP
};