#!/usr/bin/env nu

./build.nu

pnpx wispctl deploy crescentro.se --path ./public --site crescentrose
