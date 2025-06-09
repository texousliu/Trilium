import { readFile } from 'fs/promises';
import { compile } from 'ejs';

export default function esbuildPluginEjs(options = {}) {
  return {
    name: 'ejs',
    setup(build) {
      build.onLoad({ filter: /\.ejs$/ }, async args => {
        const template = await readFile(args.path, 'utf8')
        const ejsOptions = {
            ...options,
            client: true,
            strict: true,
            compileDebug: false }
        const generator = compile(template, ejsOptions)
        const contents = `module.exports = ${generator.toString()};`
        return { contents, loader: 'js' }
      })
    }
  }
}
