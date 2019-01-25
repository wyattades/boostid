# Visual Regression Tests

Visual Regression tests are useful for confirming that non-visual updates to code don't affect your website's visuals
(If your changes include visual updates e.g. changes to a theme, don't run this test as it will most likely fail).

In the config file, specify which pages you would like to run visual regression on, as well as elements you wish to ignore.

After you push any code changes to `https://updates-<sitename>.pantheonsite.io`, the program will do the following:
1. Run headless Chrome and navigate to `https://updates-<sitename>.pantheonsite.io` and `https://live-<sitename>.pantheonsite.io`
2. Compare the specified pages, while ignoring the specified elements
3. If discrepancies exist outside of a certain margin, the test will fail and a browser window will open that shows where the websites differ. Exiting the program or closing this browser window will conclude the test.
   