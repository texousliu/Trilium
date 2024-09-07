import options from '../services/options.js';

function loadEnvironmentVariables(){
    if (process.env.TOTP_ENABLED === undefined) {
        options.setOption("totpEnabled", false);
        return false;
    }
    
    if (process.env.TOTP_ENABLED.toLocaleLowerCase() !== 'true') {
        options.setOption("totpEnabled", false);
        return false;
    }

    options.setOption("totpEnabled", true);
}

export default {
    loadEnvironmentVariables
}