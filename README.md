<h1 align="center">Welcome to webSNMP 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.2-blue.svg?cacheSeconds=2592000" />
  <a href="https://github.com/hertyxyz/webSNMP#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/hertyxyz/webSNMP/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
</p>

> Simple API to poll SNMP-compatable devices and 

### 🏠 [Homepage](https://github.com/hertyxyz/webSNMP#readme)

This project has been overhauled! It is no longer a standalone API for polling only Sharp printers, but a full-blown framework for polling any SNMP-enabled device and exposing the data over an HTTP interface.

You will need to configure webSNMP before it does anything useful. This is done with the `config.yaml` file in the config directory. webSNMP is fairly simple to configure by following the documentation in the sample file's comments.

## Install

```sh
pnpm i
cd config
cp config.sample.yaml config.yaml
```

## Usage

```sh
pnpm run dev
-- or --
npm run dev
-- or --
yarn dev
```

## Author

👤 **Owen Flaherty**

* Website: https://thatsimplekid.com
* Github: [@owenflaherty](https://github.com/owenflaherty)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/hertyxyz/webSNMP/issues).

## Show your support

Give a ⭐️ if this project helped you!

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
