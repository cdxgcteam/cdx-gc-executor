var version = '0.0.1';
// Node JS Requires:
var util = require('util');
var fs = require("fs");
var exec = require('child_process').execFile;
var os = require('os');

// Selenium Requires:
var bmp = require('browsermob-proxy').Proxy;
var webdriver = require('selenium-webdriver');
var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer; // They need to update their docs. I think this might be a mistake.

// Support Module Requires:
var cmdr = require('commander');
var _ = require("underscore");
var q = require("q");


// Global Statics:
var SELENIUM_LINUX_DEFAULT_PATH = './selenium/selenium-server-standalone-2.33.0.jar';
var SELENIUM_WINDOWS_DEFAULT_PATH = '.\\selenium\\selenium-server-standalone-2.33.0.jar';
var BROWSERMOB_LINUX_DEFAULT_PATH = './browsermob/browsermob-proxy-2.0-beta-8/bin/browsermob-proxy';
var BROWSERMOB_WINDOWS_DEFAULT_PATH = '.\\browsermob\\browsermob-proxy-2.0-beta-8\\bin\\browsermob-proxy.bat';

cmdr.version(version)
	.option('-c, --config_file <path>', 'Path to executor configuration file')
	.on('--help', function(){
	  console.log('*** To get command syntax for different commands use the \'<command> --help\' pattern.');
	  console.log('');	
	});

cmdr.command('central')
	.description('Central Server Executor -- Use RabbitMQ Messaging server to recieve tasking.')
	.option('-rh, --r_hostname <hostname>', 'RabbitMQ Server Hostname')
	.option('-rp, --r_port <n>', 'RabbitMQ Server Port', parseInt)
	.option('-ru, --r_user <username>','RabbitMQ Server Username')
	.option('-rp, --r_pass <password>', 'RabbitMQ Server Username')
	.option('-rv, --r_vhost <vhost>', 'RabbitMQ Server Username')
	.option('-s, --sel <path>', 'Path to Selenium JAR File', verifySeleniumPath)
	.option('-sh, --sel_hostname <hostname>', 'Selenium execution hostname')
	.option('-sp, --sel_port <n>', 'Selenium execution port number', parseInt)
	.option('-px, --proxy_path [path]', 'Use Browsermob Proxy', verifyBrowserMobPath)
	.option('-ph, --proxy_hostname <hostname>', 'Browsermob proxy hostname', parseInt)
	.option('-pp, --proxy_port <n>', 'Browsermob proxy control port', parseInt)
	.action(function(centralCmdr) {
		
		// Deal with options:
		var opt = centralOptionGenerator(centralCmdr);
		
		console.log('Arguments: ',util.inspect(centralCmdr, {colors: true}));
		console.log('Options: ',util.inspect(opt, {colors: true}));
		
		// Start the Processors:
		var prom_proxy = centralSetup(opt);
		console.log('prom_proxy: ',util.inspect(prom_proxy, {colors: true}));
		prom_proxy.then(function (responseText) {
		    // If the HTTP response returns 200 OK, log the response text.
		    console.log(responseText);
			console.log(opt);
		});
	});

cmdr.parse(process.argv);

console.log(util.inspect(os.platform(), {colors: true}));

function centralOptionGenerator(cmdrOpts) {
	var selenium = {};
	var rabbit = {};
	var browsermob = {};
	
	selenium.path = verifySeleniumPath(cmdrOpts.sel);
	selenium.host = cmdrOpts.sel_hostname || 'localhost';
	selenium.port = cmdrOpts.sel_port || 4444;
	
	rabbit.host = cmdrOpts.r_hostname || 'localhost';
	rabbit.port = cmdrOpts.r_port || 5672;
	rabbit.user = cmdrOpts.r_user || 'guest';
	rabbit.pass = cmdrOpts.r_pass || 'guest';
	rabbit.vhost = cmdrOpts.r_vhost || '/';
	
	browsermob.path = verifyBrowserMobPath(cmdrOpts.proxy_path);
	browsermob.host = cmdrOpts.proxy_hostname || 'localhost';
	browsermob.port = cmdrOpts.proxy_port || 8080;
	
	var opt = {};
	opt.s = selenium;
	opt.r = rabbit;
	opt.b = browsermob;
	
	console.log('centralOptionGenerator: ',util.inspect(opt, {colors: true}));
	return opt;
}

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
	console.log(util.inspect(SeleniumServer, {colors: true}));

	var server = new SeleniumServer({
	  jar: selenium_path,
	  port: 4444
	});

	console.log(util.inspect(SeleniumServer, {colors: true}));

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
