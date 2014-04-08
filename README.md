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

Download one of the following files based on the OS of the system:

	cdxexecutor-linux-0.0.2.tar.gz
	cdxexecutor-windows-0.0.2.exe

NOTE: The windows version is a 7Zip self-extracting archive. The linux version assumes tar and gzip is installed.

In Windows:

1. Double click on the cdxexecutor-windows-0.0.2.exe file and put it in your working directory.
2. Go to the Run command or click the Search box in Windows Menu.
3. Type "cmd" and hit enter.
4. Follows steps 1 and 2 again.
5. You should now have two CMD shells open.
6. Change the directory of both shells to where you put windows cdxexecutor files.
7. In one of the shells type:

		.\run_selenium.bat

8. If that was successful, then it should run stay running and a bunch of log message should show up on the screen.
9. On the other shell type:\

		.\node.exe executor.js -s <your school> -m <the machine> -b <your browser choice>

	Example(s):
	
		.\node.exe executor.js -s navy -m win7 -b ie
		.\node.exe executor.js -s airforce -m winXP -b firefox

10. If you see log message like "Waiting for tasks..." then everything is working.
11. Just watch the show. Get a cup of coffee, you are done for now.

In Linux:

1. Start "Terminal".
2. Open 2 terminals or 2 tabs.
3. Change the directory on both terminals to the same place you put linux tar file.
4. Expand the tar file:
	
		tar -vxzf cdxexecutor-linux-0.0.2.tar.gz

5. In one of the shells type:

		./run_selenium.sh

6. If that was successful, then it should run stay running and a bunch of log message should show up on the screen.
7. On the other shell type:\

		./node executor.js -s <your school> -m <the machine> -b <your browser choice>

	Example(s):
	
		.\node.exe executor.js -s navy -m win7 -b ie
		.\node.exe executor.js -s airforce -m winXP -b firefox

8. If you see log message like "Waiting for tasks..." then everything is working.
9. Just watch the show. Get a cup of coffee, you are done for now.
