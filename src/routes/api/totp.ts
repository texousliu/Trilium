import { generateSecret } from 'time2fa';
import config from '../../services/config.js';

function generateTOTPSecret() {
    return { success: true, message: generateSecret() };
}

function getTotpEnabled() {
    return config.MultiFactorAuthentication.totpEnabled;
}

function getTOTPStatus() {
    return { success: true, message: getTotpEnabled(), enabled: getTotpEnabled() };
}

function getSecret() {
    return config.MultiFactorAuthentication.totpSecret;
}

export default {
    generateSecret: generateTOTPSecret,
    getTOTPStatus,
    getSecret
};