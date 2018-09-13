# track-coach
Simple replacement for npm run scripts

## Why?

`npm run TASK_NAME` is a sufficient task runner in _most_ scenarios, but making it work cross-platform requires a combination of things like [`npm-run-all`](https://www.npmjs.com/package/npm-run-all) or [`concurrently`](https://www.npmjs.com/package/concurrently) and the use of `pre-` and `post-` prefixes. This can become really unwieldy if you want to start a server, run a task, then shut down a server. `track-coach` makes this process easy.

## Install

`npm install --save-dev track-coach`

## Usage

```json
// package.json

{
  ...
  "scripts": {
    "start": "node ./scripts.js"
  }
}
```

```javascript
// scripts.js

const {
  coach,
  run,
  hide,
  prepare,
  delay,
  managedRun,
} = require('track-coach');

const tasks = {
  string: "echo 'you can use a string'",

  fn() {
    console.log('you can use a function');
  },

  variable({ someVar }) {
    // npm start --someVar=thing
    console.log(`you can pass variables like ${someVar}`);
  },

  env() {
    // changing process.env changes variables in the shell
    process.env.CUSTOM = 'blah';
    await run('echo $CUSTOM');
  },

  async shellOut() {
    await run('echo "run allows you to shell out"');
  },

  async hideSecret() {
    // Note: hide only hides the secret in the track-coach logs,
    //       not the shell output
    await run(`echo "hide a ${hide('secret')} from the logs"`);
  },

  async prepareCommand() {
    await run(prepare`
      echo "prepare allows
            you to separate
            commands if it's
            easier to read"
    `);
  },

  // managedRun allows you to start a script, then end it later
  startServer() {
    return managedRun('npm run server');
  },
  doTask() {
    const server = tasks.startServer();

    await delay(1000);
    console.log('delay makes it easy to wait for x ms');

    server.childProcess.kill();
    await server.promise();
  }
};

coach(tasks);
```

Now you can run any of the tasks with `npm start TASK_NAME`

## License
MIT
