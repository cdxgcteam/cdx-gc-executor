cdx-gc-executor
===============

CDX Grey Cell Executor - This is the execution component to the CDX Grey Cell Automation platform. The key execution methodology is Selenium.

Important Links:

- Selenium
	- [Site](http://seleniumhq.org)
	- Notes:
		- Provides the cross-platform browser automation. 
	- Download List: [{Source}](http://docs.seleniumhq.org/download/)
		- Selenium Server (current version: [2.33.0](http://selenium.googlecode.com/files/selenium-server-standalone-2.33.0.jar))
		- IE Driver (current version: [2.33.0 32bit](http://code.google.com/p/selenium/downloads/detail?name=IEDriverServer_Win32_2.33.0.zip), [2.33.0 64but](http://code.google.com/p/selenium/downloads/detail?name=IEDriverServer_x64_2.33.0.zip))
	- Web Driver Information:
		- [Selenium-Webdriver](https://code.google.com/p/selenium/wiki/WebDriverJs)
		- [Node Webdriver.js](https://github.com/camme/webdriverjs)

- Browsermob Proxy
	- [Site](http://bmp.lightbody.net/)
	- Notes:
		- Deals with the possible SSL issues with self-signed certificates. This will minimize load errors.
		- [SSL Certificate Guide for IE](http://blog.mogotest.com/2013/03/05/how-to-accept-self-signed-ssl-certificates-in-selenium2/) (Recently update: 03-05-2013).
		- Provided HAR generation support to prove what is being send to be browser is as expected without human intervention.
			- This will reduce human interaction and verification in combination with Selenium load information.
	- [Node JS Controller Library](https://github.com/zzo/browsermob-node)
	
- Node JS
	- [Site](http://nodejs.org/)
	- [Docs](http://nodejs.org/api/)
	- See [package.json](package.json) for dependencies and other critical information.
	
Install:

	