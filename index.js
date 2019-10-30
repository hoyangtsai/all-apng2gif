const packageJson = require('./package.json');
const program = require('commander');
const glob = require('glob');
const path = require('path');
const apng2gif = require('apng2gif');

require('colors');

const pkgName = packageJson.name;
const currentDir = process.cwd();

program
  .version(packageJson.version)
  .arguments('<source> [otherSource...]')
  .action(function (source, otherSource) {
    inputSrc = source;
    inputOtherSrc = otherSource;
    const dir = path.dirname(source);
    convert2gif(source, dir);
    otherSource.forEach(file => {
      const otherDir = path.dirname(file);
      convert2gif(file, otherDir);
    })
  })
  .parse(process.argv)

if (typeof inputSrc === 'undefined') {
  const lookup = path.join(currentDir, '*.png');
  try {
    const matches = glob.sync(lookup);
    matches.forEach(file => {
      convert2gif(file);
    })
  } catch (error) {
    log(`${error}`, 'error')
  }
}

function convert2gif (pngFile, targetDir) {
  log(`讀取 => ${pngFile}`)
  if (path.extname(pngFile) != '.png') {
    log(`${pngFile} 檔案類型不符`)
    return;
  }

  const filename = path.basename(pngFile, '.png');
  const outputFile = targetDir ?
    path.join(targetDir, `${filename}.gif`) : path.join(currentDir, `${filename}.gif`);

  log(`輸出 => ${outputFile}`)
  apng2gif(pngFile, outputFile).catch(e => {
    log(`apng2gif error => ${e}`, 'error')
  })
}

function log() {
  let args = Array.prototype.slice.call(arguments);
  args[0] = (args[1] === 'error' ? `[${pkgName}] `.red : `[${pkgName}] `.blue) + args[0];
  args = args.slice(0, 1);
  console.log.apply(console, args);
}