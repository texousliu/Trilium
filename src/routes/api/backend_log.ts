"use strict";

import { readFile  } from "fs/promises";
import { join } from "path";
import dateUtils from "../../services/date_utils.js";
import dataDir from "../../services/data_dir.js";
import log from "../../services/log.js";

const { LOG_DIR } = dataDir;

async function getBackendLog() {
    const fileName = `trilium-${dateUtils.localNowDate()}.log`
    try {
        const file = join(LOG_DIR, fileName);
        return await readFile(file, "utf8");
    } catch (e) {
        log.error((e instanceof Error) ? e : `Reading the backend log '${fileName}' failed with an unknown error.`);

        // most probably the log file does not exist yet - https://github.com/zadam/trilium/issues/1977
        return "";
    }
}

export default {
    getBackendLog
};
