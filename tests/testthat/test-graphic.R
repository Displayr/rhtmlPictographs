context("graphic")

test_that("Uses default '{}' when no argument given, and sets sizingPolicy, package and can-run-in-root-dom", {
    g <- rhtmlPictographs::graphic()

    expect_equal(g$x, '{}')
    expect_s3_class(g, c("rhtmlPictographs", "htmlwidget"), exact = TRUE)
    expect_identical(attr(g, "can-run-in-root-dom"), TRUE)
    expect_identical(g$sizingPolicy$browser$fill, TRUE)
    expect_identical(g$sizingPolicy$viewer$fill, TRUE)
    expect_equal(g$sizingPolicy$padding, 0)
    expect_equal(attr(g, "package"), "rhtmlPictographs")
})

test_that("Passes through a supplied settings JSON string unchanged", {
    settings <- '{"variableImage":"circle:horizontal:blue","percentage":"0.4","width":400,"height":400}'

    g <- rhtmlPictographs::graphic(settings)

    expect_equal(g$x, settings)
})

test_that("Accepts a non-JSON / malformed string without erroring, and stores it verbatim", {
    settings <- "not json"

    expect_error(g <- rhtmlPictographs::graphic(settings), NA)
    expect_equal(g$x, settings)
})
