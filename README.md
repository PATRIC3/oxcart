
# Oxcart

PATRIC3 Web Application for data browser / app tasker.

## Nightly Build

http://p3.theseed.org/oxcart

## Local Installation

```
git clone --recursive https://github.com/PATRIC3/oxcart.git oxcart
bower install
```

Notes:
- The `--recursive` flag installs some submodules in `lib/`
- `bower install` installs some third-party (front-end) dependencies

Then point your favorite webserver at `oxcart`

### Build

This step creates an `index.html` with concatenated/minimized CSS/JS files (located in `build/`).

From `oxcart`:

```
npm install
grunt build
```

Notes:
- "npm install" installs grunt dependencies.
- "grunt build" does the work


## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## Author(s)

Neal Conrad <nconrad@anl.gov>

## License

Released under [the MIT license](https://github.com/nconrad/ng-browse).
