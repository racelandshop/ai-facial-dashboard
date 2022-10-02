const gulp = require("gulp");
const del = require("del");
require("./rollup.js");
require("./translations");

gulp.task("cleanup", (task) => {
  del.sync(["./frontend-release/build/**", "./frontend-release/build"]);
  del.sync(["./cameras_dashboard/*.js", "./cameras_dashboard/*.json", "./cameras_dashboard/*.gz"]);
  task();
});

gulp.task("common", gulp.series("cleanup", "generate-translations"));
