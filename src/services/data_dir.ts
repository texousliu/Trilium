"use strict";

/*
 * This file resolves trilium data path in this order of priority:
 * - if TRILIUM_DATA_DIR environment variable exists, then its value is used as the path
 * - if "trilium-data" dir exists directly in the home dir, then it is used
 * - based on OS convention, if the "app data directory" exists, we'll use or create "trilium-data" directory there
 * - as a fallback if the previous step fails, we'll use home dir
 */

import os from "os";
import fs from "fs";
import { join as pathJoin} from "path";

function getAppDataDir() {
    let appDataDir = os.homedir(); // fallback if OS is not recognized

    if (os.platform() === "win32" && process.env.APPDATA) {
        appDataDir = process.env.APPDATA;
    } else if (os.platform() === "linux") {
        appDataDir = `${os.homedir()}/.local/share`;
    } else if (os.platform() === "darwin") {
        appDataDir = `${os.homedir()}/Library/Application Support`;
    }

    if (!fs.existsSync(appDataDir)) {
        // expected app data path doesn't exist, let's use fallback
        appDataDir = os.homedir();
    }

    return appDataDir;
}

const DIR_NAME = "trilium-data";
const FOLDER_PERMISSIONS = 0o700;

function createDirIfNotExisting(path: fs.PathLike, permissionMode: fs.Mode = FOLDER_PERMISSIONS) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, permissionMode);
  }
}

function getTriliumDataDir() {
    if (process.env.TRILIUM_DATA_DIR) {
        createDirIfNotExisting(process.env.TRILIUM_DATA_DIR);
        return process.env.TRILIUM_DATA_DIR;
    }

    const homePath = pathJoin(os.homedir(), DIR_NAME);
    if (fs.existsSync(homePath)) {
        return homePath;
    }

    const appDataPath = pathJoin(getAppDataDir(), DIR_NAME);
    createDirIfNotExisting(appDataPath);

    return appDataPath;
}

const TRILIUM_DATA_DIR = getTriliumDataDir();

const DOCUMENT_PATH = process.env.TRILIUM_DOCUMENT_PATH || pathJoin(TRILIUM_DATA_DIR, "document.db");
const BACKUP_DIR = process.env.TRILIUM_BACKUP_DIR || pathJoin(TRILIUM_DATA_DIR, "backup");
const LOG_DIR = process.env.TRILIUM_LOG_DIR || pathJoin(TRILIUM_DATA_DIR, "log");
const ANONYMIZED_DB_DIR = process.env.TRILIUM_ANONYMIZED_DB_DIR || pathJoin(TRILIUM_DATA_DIR, "anonymized-db");
const CONFIG_INI_PATH = process.env.TRILIUM_CONFIG_INI_PATH || pathJoin(TRILIUM_DATA_DIR, "config.ini");

export default {
    TRILIUM_DATA_DIR,
    DOCUMENT_PATH,
    BACKUP_DIR,
    LOG_DIR,
    ANONYMIZED_DB_DIR,
    CONFIG_INI_PATH
};
