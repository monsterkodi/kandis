#!/usr/bin/env bash
cd `dirname $0`/..

if rm -rf ko-win32-x64; then

    konrad
    
    node_modules/.bin/electron-rebuild
    
    IGNORE="(.*\.dmg$|Icon$|.*md$|/coffee$|/inno$|/pug$|/styl$|package\.noon$|.*\.lock$|three/examples)"
    node_modules/electron-packager/cli.js . --overwrite --icon=img/app.ico --ignore $IGNORE
    
    mkdir ko-win32-x64/resources/app/coffee
    cp -f ./coffee/menu.noon ko-win32-x64/resources/app/coffee

fi    