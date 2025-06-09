import { readFile } from 'fs/promises';
import { compile, type Options } from 'ejs';
import { resolve, dirname, basename } from 'path';

export default function esbuildPluginEjs(options = {}) {
    return {
        name: 'ejs',
        setup(build) {
            build.onLoad({ filter: /\.ejs$/ }, async args => {
                const ejsOptions: Options = {
                    ...options,
                    client: true,
                    strict: true,
                    compileDebug: false
                }

                const contents: string[] = [];
                contents.push(`const includeMap = {}`);
                contents.push(`
                    function __include(name, ...args) {
                        return includeMap[name](...args);
                    }
                `);

                let main;

                // Compile the subtemplates.
                const subtemplates = await collectTemplateTree(args.path);
                for (const [ path, subtemplate ] of Object.entries(subtemplates)) {
                    const functionName = basename(path).split(".")[0];
                    const isMain = (path === args.path);

                    const generator = compile(subtemplate, ejsOptions);
                    const functionOutput = generator.toString().split("\n");

                    if (isMain) {
                        functionOutput[0] = functionOutput[0].replace(/^function anonymous/, `module.exports = function`);
                    } else {
                        functionOutput[0] = functionOutput[0].replace(/^function anonymous/, `includeMap["${functionName}"] = function`);
                    }

                    // Inject include function.
                    functionOutput[2] = `include = __include;\n${functionOutput[2]}`;

                    if (isMain) {
                        main = functionOutput.join("\n");
                    } else {
                        contents.push(functionOutput.join("\n"));
                    }
                }

                // Compile the rest.
                if (!main) {
                    throw new Error("Missing main entry point");
                }
                contents.push(main);

                return { contents: contents.join("\n"), loader: 'js' }
            })
        }
    }
}


const includeRegex = /<%-?\s*include\((['"`])(.+?)\1\s*(?:,[^)]+)?\)\s*-?%>/g;

async function collectTemplateTree(filePath, seen: Record<string, string> = {}) {
    if (seen[filePath]) return;

    const source = await readFile(filePath, 'utf8');
    seen[filePath] = source;

    const dir = dirname(filePath);

    const matches = [...source.matchAll(includeRegex)];
    for (const match of matches) {
        const includePath = match[2];

        // Add .ejs extension if needed
        const resolvedPath = resolve(dir, includePath.endsWith('.ejs') ? includePath : includePath + '.ejs');
        await collectTemplateTree(resolvedPath, seen);
    }

    return seen;
}
