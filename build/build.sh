#!/usr/bin/env bash
uglifyjs ../../node_modules/cytoscape/dist/cytoscape.js ../../node_modules/cytoscape-arbor/cytoscape-arbor.js ../src/core/relation.js -m -o ./../relation.min.js


