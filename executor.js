// ----------------------------
// Info:
// ----------------------------
// Title: cdxgc_manager_server.js
// Description: CDX Grey Cell Manager Server
// Author: Derek Yap <zangzi@gmail.com>
// License: MIT
// Version: 0.0.1
var version = '0.0.1';

// ----------------------------
// Requires:
// ----------------------------
// - Built-ins:
var util = require('util');
var fs = require("fs");
var exec = require('child_process').execFile;
var os = require('os');

// - BrowserMob Proxy
var bmp = require('browsermob-proxy').Proxy;

// - Selenium Web Driver Module
var webdriver = require('selenium-webdriver');

// - Selenium Server Control Module
var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;

// - Commander (Command Line Utility)
var cmdr = require('commander');

// - Lodash
var _ = require('lodash-node');

// - Promises...
var when = require("when");
var all = require('when').all;

// - AMQP -> RabbitMQ Connection Library
var amqp = require('amqplib');

// - moment - Date Formatter:
var moment = require('moment');

// - Logging
var winston = require('winston');
var logger = new (winston.Logger)({
	exitOnError: false,
	transports: [
		new (winston.transports.Console)({level: 'debug', colorize: true, timestamp: true})//,
		//new (winston.transports.File)({ filename: 'info.log' })
	]//,
	// exceptionHandlers: [
	// 	new winston.transports.File({ filename: 'exceptions.log' })
	// ]
});

// ----------------------------
// GLOBALS:
// ----------------------------
var SELENIUM_LINUX_DEFAULT_PATH = './selenium/selenium-server-standalone-2.41.0.jar';
var SELENIUM_WINDOWS_DEFAULT_PATH = '.\\selenium\\selenium-server-standalone-2.41.0.jar';
var BROWSERMOB_LINUX_DEFAULT_PATH = './browsermob/browsermob-proxy-2.0-beta-9/bin/browsermob-proxy';
var BROWSERMOB_WINDOWS_DEFAULT_PATH = '.\\browsermob\\browsermob-proxy-2.0-beta-9\\bin\\browsermob-proxy.bat';

var SELENIUM_HOST = 'localhost';
var SELENIUM_PORT = 4444;
var BROWSERMOB_HOST = 'localhost';
var BROWSERMOB_PORT = 8080;

var AMQP_IP = "10.0.20.32";
var AMQP_PORT = 5672;
var AMQP_RESULTS_EXCHANGE = "direct_cdxresults";
var AMQP_RESULTS_ROUTING_KEY = "task_results";

var AMQP_TASK_EXCHANGE = "topic_cdxtasks";
var AMQP_TASK_BINDING_KEYS = ["all.*", "navy.linux.*"];

var AMQP_CH = null;

// ----------------------------
// Commander:
// ----------------------------
cmdr.description('CDX GreyCell Executor -- Executes tasking from central server')
	.option('-u, --school <school>', 'Please specify ', AMQP_IP)
	.option('-ah, --amqp_host <server name or IP>', 'AMQP Server Hostname', AMQP_IP)
	.option('-ap, --amqp_port <port number>', 'AMQP Server Port', parseInt, AMQP_PORT)
	.option('-s,  --sel <path>', 'Path to Selenium JAR File', verifySeleniumPath)
	.option('-sh, --sel_hostname <hostname>', 'Selenium execution hostname', SELENIUM_HOST)
	.option('-sp, --sel_port <n>', 'Selenium execution port number', parseInt, SELENIUM_PORT)
	.option('-px, --proxy_path [path]', 'Use Browsermob Proxy', verifyBrowserMobPath)
	.option('-ph, --proxy_hostname <hostname>', 'Browsermob proxy hostname', BROWSERMOB_HOST)
	.option('-pp, --proxy_port <n>', 'Browsermob proxy control port', parseInt, BROWSERMOB_PORT)
	.parse(process.argv);

logger.debug(util.inspect(os.platform(), {colors: true}));

// function centralOptionGenerator(cmdrOpts) {
// 	var selenium = {};
// 	var rabbit = {};
// 	var browsermob = {};
// 	
// 	selenium.path = verifySeleniumPath(cmdrOpts.sel);
// 	selenium.host = cmdrOpts.sel_hostname || 'localhost';
// 	selenium.port = cmdrOpts.sel_port || 4444;
// 	
// 	rabbit.host = cmdrOpts.r_hostname || 'localhost';
// 	rabbit.port = cmdrOpts.r_port || 5672;
// 	rabbit.user = cmdrOpts.r_user || 'guest';
// 	rabbit.pass = cmdrOpts.r_pass || 'guest';
// 	rabbit.vhost = cmdrOpts.r_vhost || '/';
// 	
// 	browsermob.path = verifyBrowserMobPath(cmdrOpts.proxy_path);
// 	browsermob.host = cmdrOpts.proxy_hostname || 'localhost';
// 	browsermob.port = cmdrOpts.proxy_port || 8080;
// 	
// 	var opt = {};
// 	opt.s = selenium;
// 	opt.r = rabbit;
// 	opt.b = browsermob;
// 	
// 	logger.debug('centralOptionGenerator: ',util.inspect(opt, {colors: true}));
// 	return opt;
// }

function verifyBrowserMobPath(inputPath) {
	var browsermob_path = '';

	if (_.isString(inputPath) && inputPath !== '') {
		browsermob_path = inputPath;
	} else if (os.platform() === 'linux') {
		browsermob_path = BROWSERMOB_LINUX_DEFAULT_PATH;
	} else if (os.platform() === 'windows') {
		browsermob_path = BROWSERMOB_WINDOWS_DEFAULT_PATH;
	}
	if (fs.existsSync(browsermob_path)){
		return browsermob_path;
	} else {
		throw new Error('Browsermod Proxy path does not exist...');
	}
}

function verifySeleniumPath(inputPath) {
	var selenium_path = '';

	if (_.isString(inputPath) && inputPath !== '') {
		selenium_path = inputPath;
	} else if (os.platform() === 'linux') {
		selenium_path = SELENIUM_LINUX_DEFAULT_PATH;
	} else if (os.platform() === 'windows') {
		selenium_path = SELENIUM_WINDOWS_DEFAULT_PATH;
	}
	if (fs.existsSync(selenium_path)){
		return selenium_path;
	} else {
		throw new Error('Selenium path does not exist...');
	}
}

// ----------------------------
// Main:
// ----------------------------

var start = function () {
	
};

function centralSetup(options) {

	var proxy = new bmp({
			host: options.b.host,
			port: options.b.port
		});
		
	return q.ninvoke(proxy, "start");

	// proxy.doHAR('http://www.google.com', function(err, data) {
// 	        if (err) {
// 	            console.error('ERR: ' + err);
// 	        } else {
// 	            fs.writeFileSync('stuff.har', data, 'utf8');
// 	        }
// 	});
}

function doSelenium(proxy, cb) {
	logger.debug(util.inspect(SeleniumServer, {colors: true}));

	var server = new SeleniumServer({
	  jar: selenium_path,
	  port: 4444
	});

	logger.debug(util.inspect(SeleniumServer, {colors: true}));

	server.start();

	var driver = new webdriver.Builder().
	    usingServer(server.address()).
	    withCapabilities({
			'browserName': 'firefox',
			'acceptSslCert': true
		}).
	    build();
	
	driver.get('http://www.google.com');
	driver.findElement(webdriver.By.name('q')).sendKeys('webdriver');
	driver.findElement(webdriver.By.name('btnG')).click();
	driver.wait(function() {
	  return driver.getTitle().then(function(title) {
	    return 'webdriver - Google Search' === title;
	  });
	}, 1000);

	driver.quit();
	server.stop();
}

var message = 'Hello World!';
var logMessage = function(msg) {
	console.log(" [x] %s:'%s'",
				msg.fields.routingKey,
				msg.content.toString());
	AMQP_CH.ack(msg);
	AMQP_CH.publish(AMQP_RESULTS_EXCHANGE, AMQP_RESULTS_ROUTING_KEY, new Buffer(message));
	console.log(" RESULT!! Sent %s:'%s'", message);
};

var amqpServerPath = 'amqp://'+cmdr.amqp_host+':'+cmdr.amqp_port;
logger.info('AMQP Path: '+amqpServerPath);
amqp.connect(amqpServerPath).then(function(conn) {
	return when(conn.createChannel().then(function(ch) {
		AMQP_CH = ch;
		var tasks = ch.assertExchange(AMQP_TASK_EXCHANGE, 'topic', {durable: false});
		
	    tasks = tasks.then(function() {
			logger.info('AMQP :: Tasks Exchange Asserted.');
			return ch.assertQueue('', {exclusive: true});
	    });
		
	    tasks = tasks.then(function(qok) {
			logger.info('AMQP :: Tasks Queue Asserted.');
			var queue = qok.queue;
			return all(AMQP_TASK_BINDING_KEYS.map(function(rk) {
				ch.bindQueue(queue, AMQP_TASK_EXCHANGE, rk);
			})).then(function() {
				logger.info('AMQP :: Tasks Queues Binded.');
				return queue;
			});
	    });
		
		tasks = tasks.then(function(queue) {
			return ch.consume(queue, logMessage, {noAck: false});
		});
		return tasks.then(function() {
			logger.info(' AMQP :: Waiting for tasks. To exit press CTRL+C.');
		});
	}));
}).then(null, console.warn);