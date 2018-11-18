
const _ = require('lodash');
const bugsnag = require('bugsnag');
const winston = require('winston');
const Transport = require('winston-transport');
const util = require('util');

class BugsnagLogger extends Transport {

  get name() {
    return 'bugsnag';
  }
  constructor(options = {}) {
    //
    // Inherit from `winston-transport`.
    //
    super(options);

    options = _.defaultsDeep(options, {
      apiKey: process.env.BUGSNAG_API_KEY || '',
      config: {},
      name: 'bugsnag',
      silent: false,
      level: 'info',
      levelsMap: {
        silly: 'info',
        verbose: 'info',
        info: 'info',
        debug: 'info',
        warn: 'warning',
        error: 'error'
      }
    });

    if (options.bugsnag) {
      this.bugsnag = options.bugsnag;
    } else {
      this.bugsnag = bugsnag;
      this.bugsnag.register(options.apiKey, options.config);
    }
  }

  log(level, msg, meta, fn) {

    if (this.silent) return fn(null, true);
    if (!(level in this._levelsMap)) return fn(null, true);

    meta = meta || {};
    meta.severity = this._levelsMap[level];
    meta.metaData = meta.metaData || {};

    //
    // TODO: this is currently unknown and poorly documented by Bugsnag
    // (e.g. bugsnag-js sends a different payload than bugsnag-node does)
    // <insert facepalm here>
    //

    if (_.isError(msg) && !_.isObject(meta.metaData.err)) {
      meta.metaData.err = { stack: msg.stack, message: msg.message };
      msg = msg.message;
    }

    if (_.isError(meta) && !_.isObject(meta.metaData.err)) {
      meta.metaData.err = { stack: meta.stack, message: meta.message };
      if (!_.isString(msg))
        msg = meta.message;
    }

    this.bugsnag.notify(msg, meta, function() {
      fn(null, true);
    });

  }
};
