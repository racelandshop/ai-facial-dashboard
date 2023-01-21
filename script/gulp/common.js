const gulp = require("gulp");
const del = require("del");
require("./rollup.js");
require("./translations");

gulp.task("cleanup", (task) => {
  del.sync(["./frontend-release/build/**", "./frontend-release/build"]);
  del.sync(["./ai_facial_recognition/*.js", "./ai_facial_recognition/*.json", "./ai_facial_recognition/*.gz"]);
  task();
});

gulp.task("common", gulp.series("cleanup", "generate-translations"));
