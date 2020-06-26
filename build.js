#!/usr/bin/env node
import { promises, readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { gzipSync } from 'zlib'
import Terser from 'terser'
import buble from 'buble'

const fs = promises

const name = 'staterino'
const globalName = name
const srcName = name + '.js'
const outName = name + '.min.js'
const es5SrcName = name + '.es5.js'
const es5OutName = name + '.es5.min.js'

const input = readFileSync(name + '.js', 'utf8')

const terserOut = Terser.minify(
  { [srcName]: input },
  {
    module: true,
    ecma: 8,
    mangle: { properties: { regex: /^_/ } },
    sourceMap: { filename: outName, url: outName + '.map' }
  }
)

// const p = (...args) => (console.log(...args), args[0])

const umdBoiler = code => `;(function(root, factory) {
  if(typeof define === 'function' && define.amd) define([], factory)
  else if(typeof module === 'object' && module.exports) module.exports = factory()
  else root.${globalName} = factory()
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict'
  var exports = {}
${code}
  return exports
})
`

const moduleToBrowser = code =>
  umdBoiler(
    code
      .replace(/export\s+(const|let|var)\s+([^\s]+)/gi, '$1 $2 = exports.$2')
      .replace(/export\s+\{([^}]+)\}/, (_, names) =>
        names
          .split(',')
          .map(name => `exports.${name} = ${name}`)
          .join('\n')
      )
      .replace(/export\s+default\s+([^\s]+)/gi, 'exports = Object.assign($1, exports)')
      .replace(/^/gm, '  ')
  )

const bubleOut = buble.transform(moduleToBrowser(input), {
  modules: false,
  transforms: { dangerousForOf: true }
})
const bubleTerserOut = Terser.minify(
  { [es5SrcName]: bubleOut.code },
  {
    ecma: 5,
    mangle: { properties: { regex: /^_/ } },
    sourceMap: { filename: es5OutName, url: es5OutName + '.map' }
  }
)

const reportDiff = (path, newCode) => {
  if (!existsSync(path)) return
  const beforeSize = statSync(path).size
  const beforeGzip = gzipSync(readFileSync(path)).byteLength
  const afterSize = newCode.length
  const afterGzip = gzipSync(Buffer.from(newCode, 'utf-8')).byteLength
  console.log(
    [
      '== ' + path + ' ==',
      'Before: ' + beforeSize + ' (gzip ' + beforeGzip + ')',
      ' After: ' + afterSize + ' (gzip ' + afterGzip + ')',
      '  Diff: ' + (afterSize - beforeSize) + ' (gzip ' + (afterGzip - beforeGzip) + ')',
      ''.padStart(path.length + 6, '='),
      ''
    ].join('\n')
  )
}

fs.mkdir('dist', { recursive: true }).then(() => {
  // copy main source file
  fs.writeFile(join('dist', srcName), input)
  fs.writeFile(join('dist', es5SrcName), bubleOut.code)

  // write min file and source map
  const outPath = join('dist', outName)
  reportDiff(outPath, terserOut.code)
  fs.writeFile(outPath, terserOut.code)
  fs.writeFile(outPath + '.map', terserOut.map)

  // write out transpiled source
  const es5OutPath = join('dist', es5OutName)
  reportDiff(es5OutPath, bubleTerserOut.code)
  fs.writeFile(es5OutPath, bubleTerserOut.code)
  fs.writeFile(es5OutPath + '.map', bubleTerserOut.map)
})
