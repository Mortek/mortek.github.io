.PHONY: build css js clean

build: css js

css: style.min.css

js: site.min.js

style.min.css: style.css
	npx --yes csso-cli style.css -o style.min.css

site.min.js: site.js
	terser site.js -o site.min.js -c -m

clean:
	rm -f style.min.css site.min.js
