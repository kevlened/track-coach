const dlv = require('dlv');
const { spawn } = require('child_process');

// FIXME: nested child_process in a run sometimes breaks

// turns into single line and ensures undefined expressions are empty strings
function prepare() {
  return arguments[0]
    .map((s, i) => [s, arguments[i + 1]].join(''))
    .join('')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .join(' ');
}

const hiddenRegExp = new RegExp('-~{(.*?)}~-', 'g');
function hide(string = '') {
  return `-~{${string}}~-`;
}

function managedRun(command) {
  const censored = command.replace(hiddenRegExp, '****');
  console.log('$', censored);
  const uncensored = command.replace(hiddenRegExp, '$1');
  const [cmd, args] = uncensored.split(/\s(.*)/, 2);
  const childProcess = spawn(cmd, args ? args.split(' ') : [], {
    env: process.env,
    shell: true,
    stdio: [process.stdin, process.stdout, process.stderr],
    windowsHide: true,
  });

  // TODO: if this process is killed, proxy the command to the child process

  const promise = new Promise((resolve, reject) => {
    childProcess.once('exit', code => (!code
      ? resolve()
      : reject(new Error(`Exit with error code: ${code}`))));
    childProcess.once('error', reject);
  });

  return {
    childProcess,
    promise: () => promise,
  };
}

function run(command) {
  return managedRun(command).promise();
}

function getCallerFile() {
  const old = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => {
    Error.prepareStackTrace = old;
    return stack;
  };
  const { stack } = new Error();
  while (stack.length) {
    const callerfile = stack.shift().getFileName();
    if (callerfile !== __filename) return callerfile;
  }
}

function coach(tasks) {
  // get rid of the path to this point
  const cliArgs = process.argv.slice(process.argv.indexOf(getCallerFile()) + 1);
  const name = cliArgs[0] || '';
  const args = cliArgs.slice(1).reduce((prev, curr) => {
    curr = /-*(.*)/.exec(curr)[1];
    const [key, value] = curr.split(/=(.*)/, 2);
    prev[key] = value || true;
    return prev;
  }, {});

  // add all the parent .bin directories
  process.env.PATH = `./node_modules/.bin:${process.env.PATH}`;

  const task = dlv(tasks, name);

  if (!task) {
    throw new Error(`missing script: ${name}`);
  } else if (typeof task === 'string') {
    run(task);
  } else {
    task(args);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  run,
  managedRun,
  prepare,
  hide,
  coach,
  delay,
};
