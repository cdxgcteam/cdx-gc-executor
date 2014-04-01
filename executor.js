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
var spawn = require('child_process').spawn;
var os = require('os');

// - BrowserMob Proxy
var bmp = require('browsermob-proxy').Proxy;

// - Selenium Web Driver Module
var webdriver = require('selenium-webdriver');

// - Selenium Server Control Module
var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;
var DriverService = require('selenium-webdriver/remote').DriverService;

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

var SELENIUM_SERVER = null;
var SELENIUM_DRIVER = null;

var AMQP_IP = "10.0.20.32";
var AMQP_PORT = 5672;
var AMQP_RESULTS_EXCHANGE = "direct_cdxresults";
var AMQP_RESULTS_ROUTING_KEY = "task_results";

var AMQP_TASK_EXCHANGE = "topic_cdxtasks";
var AMQP_TASK_BINDING_KEYS = ["all.*", "navy.linux.*"];

var AMQP_CH = null;

var SCHOOLS = ['navy', 'marines', 'army', 'airforce', 'coastguard', 'nps', 'rmc'];
var MACHINES = ['winxp', 'win7', 'ubuntu', 'centos'];

// ----------------------------
// Commander:
// ----------------------------
cmdr.description('CDX GreyCell Executor -- Executes tasking from central server')
	.option('-u, --school <school>', 'Please specify school or group. Allowed list: '+SCHOOLS.join(', '))
	.option('-m, --machine <machine>', 'Please specify machine. Allowed list: '+MACHINES.join(', '))
	.option('-ah, --amqp_host <server name or IP>', 'AMQP Server Hostname', AMQP_IP)
	.option('-ap, --amqp_port <port number>', 'AMQP Server Port', parseInt, AMQP_PORT)
	.option('-s,  --sel <path>', 'Path to Selenium JAR File', verifySeleniumPath, SELENIUM_WINDOWS_DEFAULT_PATH)
	.option('-sh, --sel_hostname <hostname>', 'Selenium execution hostname', SELENIUM_HOST)
	.option('-sp, --sel_port <n>', 'Selenium execution port number', parseInt, SELENIUM_PORT)
	.option('-px, --proxy_path [path]', 'Use Browsermob Proxy', verifyBrowserMobPath, BROWSERMOB_WINDOWS_DEFAULT_PATH)
	.option('-ph, --proxy_hostname <hostname>', 'Browsermob proxy hostname', BROWSERMOB_HOST)
	.option('-pp, --proxy_port <n>', 'Browsermob proxy control port', parseInt, BROWSERMOB_PORT)
	.parse(process.argv);

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
	var startDefer = when.defer();
	
	logger.info('Starting CDX GC Job Executor');
	
	// Error out if we don't get a school or group:
	if (!_.isString(cmdr.school)) {
		logger.error('School must be provided. Choices: '+SCHOOLS.join(', '));
		process.exit(1); // May need to kick out.
	} else {
		var choosenSchool = _.indexOf(SCHOOLS, cmdr.school);
		if ( choosenSchool == -1) {
			logger.error('School must be provided. Choices: '+SCHOOLS.join(', '));
			process.exit(1);
		}
	}
	
	// Error out if we don't get a school or group:
	if (!_.isString(cmdr.machine)) {
		logger.error('Machine must be provided. Choices: '+MACHINES.join(', '));
		process.exit(1); // May need to kick out.
	} else {
		var choosenSchool = _.indexOf(MACHINES, cmdr.machine);
		if ( choosenSchool == -1) {
			logger.error('Machine must be provided. Choices: '+MACHINES.join(', '));
			process.exit(1);
		}
	}
	
	logger.info('OS Platform: ' + os.platform());
	logger.info('OS Release: '+os.release());
	logger.info('OS Type: '+os.type());
	logger.info('OS Hostname: '+ os.hostname());
	logger.info('School: '+cmdr.school);
	logger.info('Machine: '+cmdr.machine);	
	logger.info('AMQP Server: ' + cmdr.amqp_host);
	logger.info('AMQP Port: ' + cmdr.amqp_port);
	logger.info('Selenium Path: '+cmdr.sel);
	logger.info('Selenium Hostname: '+cmdr.sel_hostname);
	logger.info('Selenium Port: '+cmdr.sel_port);
	logger.info('Proxy Path: '+cmdr.proxy_path);
	logger.info('Proxy Hostname: '+cmdr.proxy_hostname);
	logger.info('Proxy Port: '+cmdr.proxy_port);
	
	// Resolver:
	var executor = cmdr.school + '.' + cmdr.machine;
	startDefer.resolve(executor);

	return startDefer.promise;
};

// function centralSetup(options) {
// 
// 	var proxy = new bmp({
// 			host: options.b.host,
// 			port: options.b.port
// 		});
// 		
// 	return q.ninvoke(proxy, "start");
// 
// 	// proxy.doHAR('http://www.google.com', function(err, data) {
// // 	        if (err) {
// // 	            console.error('ERR: ' + err);
// // 	        } else {
// // 	            fs.writeFileSync('stuff.har', data, 'utf8');
// // 	        }
// // 	});
// }

// function doSelenium(proxy, cb) {
// 	logger.debug(util.inspect(SeleniumServer, {colors: true}));
// 
// 	var server = new SeleniumServer({
// 	  jar: selenium_path,
// 	  port: 4444
// 	});
// 
// 	logger.debug(util.inspect(SeleniumServer, {colors: true}));
// 
// 	server.start();
// 
// 	var driver = new webdriver.Builder().
// 	    usingServer(server.address()).
// 	    withCapabilities({
// 			'browserName': 'ie',
// 			'acceptSslCert': true
// 		}).
// 	    build();
// 	
// 	driver.get('http://www.google.com');
// 	driver.findElement(webdriver.By.name('q')).sendKeys('webdriver');
// 	driver.findElement(webdriver.By.name('btnG')).click();
// 	driver.wait(function() {
// 	  return driver.getTitle().then(function(title) {
// 	    return 'webdriver - Google Search' === title;
// 	  });
// 	}, 1000);
// 
// 	driver.quit();
// 	server.stop();
// }

//SELENIUM_SERVER = new DriverService('IEDriverServer.exe', {port: 4444});

var handleTask = function(msg) {
	logger.debug(" [x] %s:'%s'",
				msg.fields.routingKey,
				msg.content.toString());
	
	var taskingObj = JSON.parse(msg.content.toString());
	logger.debug('Tasking Object:\n'+util.inspect(taskingObj));
	if (taskingObj.cmd === 'execute_url') {
		var driver = SELENIUM_DRIVER;
		driver.get(taskingObj.url);
		driver.sleep(taskingObj.workTime);
		driver.getTitle().then(function(title) {
			var result = {};
			result.taskID = taskingObj.taskID;
			result.output = title;
			result.executor = cmdr.school + '.' + cmdr.machine;
			result.os_platform = os.platform();
			result.os_release = os.release();
			
			logger.debug('Result:\n'+util.inspect(result));
			
			var message = JSON.stringify(result);
			AMQP_CH.publish(AMQP_RESULTS_EXCHANGE, AMQP_RESULTS_ROUTING_KEY, new Buffer(message));
			logger.debug(" RESULT!! Sent %s:'%s'", AMQP_RESULTS_ROUTING_KEY, message);
			AMQP_CH.ack(msg);
		});
	}
};

start().then(function () {
	// Start Driver:
	// IE Setup:
	var portStr = '--port='+cmdr.sel_port;
	spawn('IEDriverServer.exe', [portStr], {detached: true});
	var serverAddress = 'http://localhost:'+cmdr.sel_port;
	var driver = new webdriver.Builder().
		usingServer(serverAddress).
	    withCapabilities({
			browserName: 'internet explorer',
			platform: 'WINDOWS',
			INTRODUCE_FLAKINESS_BY_IGNORING_SECURITY_DOMAINS: true
	    }).
	    build();
	
	return driver;
}).then(function (driver) {
	SELENIUM_DRIVER = driver;
	var amqpServerPath = 'amqp://'+cmdr.amqp_host+':'+cmdr.amqp_port;
	logger.info('AMQP Path: '+amqpServerPath);
	amqp.connect(amqpServerPath).then(function(conn) {
		return when(conn.createChannel().then(function(ch) {
			AMQP_CH = ch;
			
			// Setup signals:
			process.on('SIGINT', function () {
				logger.info('SIGNAL: SIGINT caught: Closing connection.');
				SELENIUM_DRIVER.quit();
				AMQP_CH.close();
				process.exit(1); // May need to kick out.
			});
			process.on('SIGTERM', function () {
				logger.info('SIGNAL: SIGTERM caught: Closing connection.');
				SELENIUM_DRIVER.quit();
				AMQP_CH.close();
				process.exit(1); // May need to kick out.
			});
			
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
				ch.prefetch(1);
				return ch.consume(queue, handleTask, {noAck: false});
			});
			return tasks.then(function() {
				logger.info(' AMQP :: Waiting for tasks. To exit press CTRL+C.');
			});
		}));
	}).then(null, logger.warn);
});