# Dev menu (testing only)

A hamburger menu in the top-left corner of every page that jumps to any screen:
the learning path, each part of Key Words, the Reading Card screens and the Quick Check screens.
The screen you are on is highlighted ("You are here"). Clicking outside the menu, pressing Esc,
or choosing a screen closes it.

## Files

- `dev-menu.js`: the menu (it also loads `dev-menu.css`)
- `dev-menu.css`: its styles

## How to remove it

1. Delete this `dev-menu` folder.
2. In `index.html`, `reading.html` and `quick-check.html`, delete the one line marked `DEV MENU` near the end.

Nothing else in the project uses it.

## Note for testers

Opening "Reading done" from the menu marks Stage 5 as done on the learning path, just as finishing it would.
To start fresh, clear the site's data in the browser.
