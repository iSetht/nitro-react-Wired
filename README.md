This nitro-react is to be used in pair with the [Arcturus Wired emulator](https://github.com/iSetht/Arcturus-Community-Wired)

This will contain all the frontend things needed for wired and the few custom features I added. Again, read the emulator README for more details but this is NOT PROD READY. I would treat this as a sandbox to use or get Claude etc to help guide you through specific wired / features you are looking for. Yarn was patched with the new @nitrots. 

I added wiredPreview and wired under \src\assets it contains some images used for wired, you may have to set the path properly to here as I was using it in my nitro-assets during testing.

Also, thanks to Chunk for providing a clean nitro as a place to start.

# Chunk Nitro - Wired

## Prerequisites

-   [Git](https://git-scm.com/)
-   [NodeJS](https://nodejs.org/) >= 18
    - If using NodeJS < 18 remove `--openssl-legacy-provider` from the package.json scripts
-   [Yarn](https://yarnpkg.com/) `npm i yarn -g`

## Installation

-   First you should open terminal and navigate to the folder where you want to clone Nitro
-   Clone Nitro
    -   `git clone https://github.com/chunk082/Chunk-Nitro.git`
-   Install the dependencies
    -   `yarn install`
    -   This may take some time, please be patient
-   Rename a few files
    -   Rename `public/renderer-config.json.example` to `public/renderer-config.json`
    -   Rename `public/ui-config.json.example` to `public/ui-config.json`
-   Set your links
    -   Open `public/renderer-config.json`
        -   Update `socket.url, asset.url, image.library.url, & hof.furni.url`
    -   Open `public/ui-config.json`
        -   Update `camera.url, thumbnails.url, url.prefix, habbopages.url`
    -   You can override any variable by passing it to `NitroConfig` in the index.html

## Usage

-   To use Nitro you need `.nitro` assets generated, see [nitro-converter](https://git.krews.org/nitro/nitro-converter) for instructions
-   See [Morningstar Websockets](https://git.krews.org/nitro/ms-websockets) for instructions on configuring websockets on your server

### Development

Run Nitro in development mode when you are editing the files, this way you can see the changes in your browser instantly

```
yarn start
```

### Production

To build a production version of Nitro just run the following command

```
yarn build:prod
```

-   A `dist` folder will be generated, these are the files that must be uploaded to your webserver
-   Consult your CMS documentation for compatibility with Nitro and how to add the production files
