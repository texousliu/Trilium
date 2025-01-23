"use strict";

import ini from "ini";
import fs from "fs";
import dataDir from "./data_dir.js";
import path from "path";
import resourceDir from "./resource_dir.js";
import { envToBoolean } from "./utils.js";

const configSampleFilePath = path.resolve(resourceDir.RESOURCE_DIR, "config-sample.ini");

if (!fs.existsSync(dataDir.CONFIG_INI_PATH)) {
    const configSample = fs.readFileSync(configSampleFilePath).toString("utf8");

    fs.writeFileSync(dataDir.CONFIG_INI_PATH, configSample);
}

const iniConfig = ini.parse(fs.readFileSync(dataDir.CONFIG_INI_PATH, "utf-8"));

export interface TriliumConfig {
    General: {
        instanceName: string;
        noAuthentication: boolean;
        noBackup: boolean;
        noDesktopIcon: boolean;
    };
    Network: {
        host: string;
        port: string;
        https: boolean;
        certPath: string;
        keyPath: string;
        trustedReverseProxy: boolean | string;
    };
    Sync: {
        syncServerHost: string;
        syncServerTimeout: string;
        syncProxy: string;
    };
}
const config: TriliumConfig = {

    General: {
        instanceName: process.env.TRILIUM_GENERAL_INSTANCENAME || iniConfig.General.instanceName,
        noAuthentication: envToBoolean(process.env.TRILIUM_GENERAL_NOAUTHENTICATION) || iniConfig.General.noAuthentication,
        noBackup: envToBoolean(process.env.TRILIUM_GENERAL_NOBACKUP) || iniConfig.General.noBackup,
        noDesktopIcon: envToBoolean(process.env.TRILIUM_GENERAL_NODESKTOPICON) || iniConfig.General.noDesktopIcon
    },

    Network: {
        host: process.env.TRILIUM_NETWORK_HOST || iniConfig.Network.host,
        port: process.env.TRILIUM_NETWORK_PORT || iniConfig.Network.port,
        https: envToBoolean(process.env.TRILIUM_NETWORK_HTTPS) || iniConfig.Network.https,
        certPath: process.env.TRILIUM_NETWORK_CERTPATH  || iniConfig.Network.certPath,
        keyPath: process.env.TRILIUM_NETWORK_KEYPATH  || iniConfig.Network.keyPath,
        trustedReverseProxy: process.env.TRILIUM_NETWORK_TRUSTEDREVERSEPROXY || iniConfig.Network.trustedReverseProxy
    },
    // @TODO correctly define here
    //Sync: {}

};


export default config;
