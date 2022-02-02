const pkg = require('./package.json');
const program = require('commander');
const glob = require('glob');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const apng2gifBin = require('apng2gif-bin');

require('colors');

const pkgName = pkg.name;
const currentDir = process.cwd();

program
  .version(pkg.version)
  .arguments('[source...]', 'source to be processed', (source, acc) => [...acc, source], [])
  .action((source) => {
    if (Array.isArray(source)) {
      if (source.length > 0) {
        source.forEach((dir) => {
          const dirStat = fs.lstatSync(dir);
          if (dirStat.isDirectory()) {
            convertImagesFromDir(source);
          } else if (dirStat.isFile()) {
            convert2gif(source);
          }
        })
      } else {
        convertImagesFromDir(currentDir);
      }
    }
  })
  .parse(process.argv)

function convertImagesFromDir(dir) {
  const lookup = path.join(dir, '*.png');
  let images = [];
  try {
    images = glob.sync(lookup);
  } catch (err) {
    log(`${error}`, 'error');
  }

  images.forEach(async (image) => {
    await convert2gif(image);
  });
}

function convert2gif(pngFile) {
  log(Y()`import ${pngFile}`)
  if (path.extname(pngFile) !== '.png') {
    log(Y()`${pngFile} file type invalid`)
    return;
  }

  const filename = path.basename(pngFile, '.png');
  const outputFile = path.isAbsolute(pngFile) ?
    path.join(path.dirname(pngFile), `${filename}.gif`) : path.join(currentDir, `${filename}.gif`);

  const toGif = spawn(apng2gifBin, [pngFile])

  log(Y()`export to ${outputFile}`)

  toGif.stdout.on('data', (data) => {
    const lines = data.toString().split(/\r?\n/);
    const errMsg = lines.find(line => line.indexOf('failed') > -1)
    if (errMsg) {
      log(errMsg, 'error')
    }
  })

  toGif.stderr.on('data', (data) => {
    log(`stderr: ${data}`, 'error')
  })

  toGif.on('close', (code) => {
    if (code !== 0) {
      log(`apng2gif exited with code ${code}`, 'error');
    }
  })
}

function log() {
  let args = Array.prototype.slice.call(arguments);
  args[0] = (args[1] === 'error' ? `[${pkgName}] `.red : `[${pkgName}] `.blue) + args[0];
  args = args.slice(0, 1);
  console.log.apply(console, args);
}

function Y() {
  return require('./lib/y18n');
}
