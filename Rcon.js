
const { Rcon } = require('rcon-client');

const states = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
};

class Rcon {
  constructor(config = {}) {
    this.config = config;
    this.state = states.DISCONNECTED;
    this.queue = [];

    this.rcon = new Rcon({ host: this.config.host, port: this.config.port, password: this.config.password });

    this.rcon.on('authenticated', () => {
      this.state = states.CONNECTED;
    });
    this.rcon.on('end', () => {
      this.state = states.DISCONNECTED;
    });

    this.tick();
  }

  connect() {
    this.rcon.connect();
  }

  disconnect() {
    this.rcon.end();
  }

  tick() {
    if (this.state === states.CONNECTED && this.queue.length > 0) {
      const item = this.queue.shift();
      this.rcon.send(item.command).then(function ({ body }) {
        return item.callback(body);
      }).catch(function (err) {
        item.callback(body, err);
      });
    }

    setTimeout(() => this.tick(), this.config.buffer);
  }

  exec(command, callback) {
    this.queue.push({
      command,
      callback,
    });
  }
}

module.exports = Rcon;
