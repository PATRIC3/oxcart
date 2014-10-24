Directions for running end-2-end tests on oxcart

1. Install node if needed (> 0.10.0)
2. Install java if needed
3. install protractor

  ```
  sudo npm install -g protractor
  ```
4. Update webdriver-manager 

  ```
  webdriver-manager update
  ```
5. Start the server

  ```
  webdriver-manager start
  ```
6. In oxcart/tests/, run tests with

  ```
  protractor config.js
  ```
and then watch selenium do its magic.
