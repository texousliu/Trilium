"use strict";

import jsDiff from "diff";
import * as sqlite from "sqlite";
import * as sqlite3 from "sqlite3";
import sql from "./sql.js";

import "colors";
import path from "path";

function printDiff(one: string, two: string) {
    const diff = jsDiff.diffChars(one, two);

    diff.forEach(function(part){
        // green for additions, red for deletions
        // grey for common parts
        const color = part.added ? 'green' :
            part.removed ? 'red' : 'grey';
        process.stderr.write(part.value[color]);
    });

    console.log("");
}

function checkMissing(table: string, name: string, ids1: string[], ids2: string[]) {
    const missing = ids1.filter(item => ids2.indexOf(item) < 0);

    if (missing.length > 0) {
        console.log("Missing IDs from " + name + " table " + table + ": ", missing);
    }
}

function handleBuffer(obj: { content: Buffer | string }) {
    if (obj && Buffer.isBuffer(obj.content)) {
        obj.content = obj.content.toString();
    }

    return obj;
}

function compareRows(table: string, rsLeft: Record<string, any>, rsRight: Record<string, any>, column: string) {
    const leftIds = Object.keys(rsLeft);
    const rightIds = Object.keys(rsRight);

    console.log("");
    console.log("--------------------------------------------------------");
    console.log(`${table} - ${leftIds.length}/${rightIds.length}`);

    checkMissing(table, "right", leftIds, rightIds);
    checkMissing(table, "left", rightIds, leftIds);

    const commonIds = leftIds.filter(item => rightIds.includes(item));

    for (const id of commonIds) {
        const valueLeft = handleBuffer(rsLeft[id]);
        const valueRight = handleBuffer(rsRight[id]);

        const left = JSON.stringify(valueLeft, null, 2);
        const right = JSON.stringify(valueRight, null, 2);

        if (left !== right) {
            console.log("Table " + table + " row with " + column + "=" + id + " differs:");
            console.log("Left: ", left);
            console.log("Right: ", right);
            printDiff(left, right);
        }
    }
}

async function main() {
    const dbLeftPath = path.resolve(process.argv[2]);
    const dbRightPath = path.resolve(process.argv[3]);

    let dbLeft: sqlite.Database;
    let dbRight: sqlite.Database;

    try {
        dbLeft = await sqlite.open({filename: dbLeftPath, driver: sqlite3.Database});
    } catch (e: any) {
        console.error(`Could not load first database at ${dbRightPath} due to: ${e.message}`);
        process.exit(1);
    }

    try {
        dbRight = await sqlite.open({filename: dbRightPath, driver: sqlite3.Database});
    } catch (e: any) {
        console.error(`Could not load second database at ${dbRightPath} due to: ${e.message}`);
        process.exit(2);
    }

    async function compare(table: string, column: string, query: string) {
        const rsLeft = await sql.getIndexed(dbLeft, column, query);
        const rsRight = await sql.getIndexed(dbRight, column, query);

        compareRows(table, rsLeft, rsRight, column);
    }

    await compare("branches", "branchId",
        "SELECT branchId, noteId, parentNoteId, notePosition, utcDateCreated, isDeleted, prefix FROM branches");

    await compare("notes", "noteId",
        "SELECT noteId, title, dateCreated, utcDateCreated, isProtected, isDeleted FROM notes WHERE isDeleted = 0");

    await compare("note_contents", "noteId",
       "SELECT note_contents.noteId, note_contents.content FROM note_contents JOIN notes USING(noteId) WHERE isDeleted = 0");

    await compare("note_revisions", "noteRevisionId",
        "SELECT noteRevisionId, noteId, title, dateCreated, dateLastEdited, utcDateCreated, utcDateLastEdited, isProtected FROM note_revisions");

    await compare("note_revision_contents", "noteRevisionId",
        "SELECT noteRevisionId, content FROM note_revision_contents");

    await compare("options", "name",
            `SELECT name, value, utcDateCreated FROM options WHERE isSynced = 1`);

    await compare("attributes", "attributeId",
        "SELECT attributeId, noteId, type, name, value FROM attributes");

    await compare("api_tokens", "apiTokenId",
        "SELECT apiTokenId, token, utcDateCreated, isDeleted FROM api_tokens");

    await compare("entity_changes", "uniqueId",
        "SELECT entityName || '-' || entityId AS uniqueId, hash, isErased, utcDateChanged FROM entity_changes WHERE isSynced = 1");
}

(async () => {
    try {
        await main();
    } catch (e) {
        console.error(e);
    }
})();
