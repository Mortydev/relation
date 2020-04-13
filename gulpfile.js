var gp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify-es').default;
gp.task("taskName",function(){
    // 把1.js和2.js合并压缩为main.js，输出到dest/js目录下
    gp.src(['node_modules/cytoscape/dist/cytoscape.js','node_modules/cytoscape-arbor/cytoscape-arbor.js','src/core/relation.js']).pipe(concat('Relation.min.js')).pipe(uglify()).pipe(gp.dest('./dest/js'));
})