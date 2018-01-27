"use strict";

var Service, Characteristic;
var exec = require("child_process").exec;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-timeout-switch", "TimeoutSwitch", TimeoutSwitch);
}

var TimeoutSwitch = function(log, config) {
    this.config = config;
    // convert seconds to miliseconds
    this.config.timeout = config.timeout * 1000;
    this.log = log;
    this.service = new Service.Switch(this.config.name);
    this.service
        .getCharacteristic(Characteristic.On)
        .on('set', this.setState.bind(this));
}

TimeoutSwitch.prototype.getServices = function() {
    return [this.service];
}

TimeoutSwitch.prototype.cmd = function(cmd, callback) {
    exec(cmd, function(error, stdout, stderr) {
        if (error) {
            this.log(stderr);
        }
        callback();
    });
};

TimeoutSwitch.prototype.setState = function(on, callback) {
    if (on == 1) {
        this.log('Accessory state is "on"');
        clearTimeout(this.timer);
        
        // execute command from config for on state
        this.cmd(this.config.cmd.on, function(error, stdout, stderr) {
            callback();
        });

        // create timer
        this.timer = setTimeout(function() {
            this.service
                .getCharacteristic(Characteristic.On)
                .setValue(false, undefined);
        }.bind(this), this.config.timeout);
    } else {
        this.log('Accessory state is "off"');
        clearTimeout(this.timer);

        // execute command from config for off state
        this.cmd(this.config.cmd.off, function(error, stdout, stderr) {
            callback();
        });
    }
}
