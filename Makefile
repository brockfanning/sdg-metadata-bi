.PHONY: test

install:
	npm install
	cd www && bundle install

build.documents:
	node scripts/prepare-build.js documents

build.sdmx:
	node scripts/prepare-build.js sdmx

build.api:
	node scripts/prepare-build.js api

build.history:
	node scripts/prepare-build.js history

build.site:
	node scripts/prepare-build.js site
	cd www && bundle exec jekyll build --trace

build: build.documents build.sdmx build.api build.site

publish: build

# Full (slow) local server, including website, API, and documents.
serve.full: build
	node scripts/watch-translations.js full &
	cd www && bundle exec jekyll serve --skip-initial-build

# Quick local server, only including the website.
serve: build.site
	cd www && bundle exec jekyll serve --skip-initial-build --trace

test:
	npm test
