/**
 * Module dependencies.
 */

var Mocha = require('mocha');
var path = require('path');
var fs = require('fs');

exports = module.exports = FileReporter;

/**
 * Initialize a new `FileReporter` test reporter.
 *
 * @param {Runner} runner
 * @param {Object} options
 */
function FileReporter(runner, options) {
    if (!runner) return;
    options = options || {};

    var reporterOptions = this.reporterOptions = options.reporterOptions || {};
    reporterOptions.file = reporterOptions.file || ".failed-tests";
    reporterOptions.keepFailed = reporterOptions.keepFailed || false;
    reporterOptions.reporter = reporterOptions.reporter;
    reporterOptions.reporterOptions = reporterOptions.reporterOptions || {};
    if (reporterOptions.reporter) {
        var _reporter;
        if (typeof reporterOptions.reporter === "function") {
            _reporter = reporterOptions.reporter;
        }
        else if (Mocha.reporters[reporterOptions.reporter]) {
            _reporter = Mocha.reporters[reporterOptions.reporter];
        }
        else {
            try {
                _reporter = require(reporterOptions.reporter);
            }
            catch (err) {
                _reporter = require(path.resolve(process.cwd(), reporterOptions.reporter));
            }
        }

        var newOptions = {};
        for (var p in options) newOptions[p] = options[p];
        newOptions.reporterOptions = reporterOptions.reporterOptions;
        this.reporter = new _reporter(runner, newOptions);
    }

    var failures = this.failures = [];
    runner.on('fail', function (test, err) {
        failures.push(test);
    });
}

FileReporter.prototype.done = function (numFailures, fn) {
    FileReporter.writeFailures(this.reporterOptions.file, this.failures, this.reporterOptions.keepFailed, done);

    function done(err) {
        var reporter = this.reporter;
        if (reporter && reporter.done) {
            reporter.done(numFailures, fn);
        }
        else {
            if (fn) fn(numFailures);
        }

        if (err) console.error(err);
    }
}

/**
 * @param file {String}
 * @param failures {Array}
 * @param keepFailed {Boolean}
 * @param fn {Function}
 */
FileReporter.writeFailures = function (file, failures, keepFailed, fn) {
    if (failures.length) {
        var failed = failures.map(function (test, i) { return escapeRegExp(test.fullTitle()); }).join("|");
        fs.writeFile(file, "--grep " + failed, "utf8", fn);
    }
    else if (!keepFailed) {
        fs.unlink(file, function () { fn(); });
    }
    else {
        fn();
    }
};

var reservedCharacterRegExp = /[^\w]/g;
function escapeRegExp(pattern) {
    return pattern.replace(reservedCharacterRegExp, function (match) { return "\\" + match; });
}