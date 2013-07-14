var util = require('util');
var webdriver = require('selenium-webdriver');
var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer; // They need to update their docs. I think this might be a mistake.

var selenium_path = './selenium/selenium-server-standalone-2.33.0.jar'

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
