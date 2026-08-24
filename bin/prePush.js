const spawn = require('child_process').spawn

Promise.resolve()
  .then(eslint)
  .catch(handleError)

function eslint () {
  console.log('>> Running "lint"')
  return spawnCommand('rhtml', ['lint'], { stdio: 'inherit' })
}

function spawnCommand (command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    // Node spawn can't spawn .bat files on windows - node exec can,
    // but there is no output until yarn completes (ie: looks frozen)
    // https://github.com/nodejs/node-v0.x-archive/issues/2318#issuecomment-263852511
    if (process.platform === 'win32') {
      options.shell = true
    }
    const cmd = spawn(command, args, options)
    cmd.on('error', err => reject(err))
    cmd.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Process exited with non-zero exit code: ${code}`))
      }
      return resolve(true)
    })
  })
}

function handleError (err) {
  console.warn(err)
  process.exit(1)
}
