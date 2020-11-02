
const modernRcon = require('modern-rcon');

const states = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
};

class Rcon {
  constructor(config = {}) {
    this.config = config;
    this.state = states.DISCONNECTED;
    this.queue = [];

    this.rcon = new modernRcon(this.config.host, this.config.port, this.config.password, 0);

    this.rcon._tcpSocket.on('connect', () => {
      this.state = states.CONNECTED;
    });
    this.rcon._tcpSocket.on('end', () => {
      this.state = states.DISCONNECTED;
    });

    this.tick();
  }

  connect() {
    this.rcon.connect();
  }

  disconnect() {
    this.rcon.close();
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
