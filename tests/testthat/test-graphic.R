context("graphic")

test_that("Uses default '{}' when no argument given, sets sizingPolicy and package attrs", {
    g <- rhtmlPictographs::graphic()

    expect_equal(g$x, '{}')
    expect_true(inherits(g, "htmlwidget"))
    expect_true(attr(g, "can-run-in-root-dom"))
    expect_true(g$sizingPolicy$browser$fill)
    expect_true(g$sizingPolicy$viewer$fill)
    expect_equal(g$sizingPolicy$padding, 0)
    expect_equal(attr(g, "package"), "rhtmlPictographs")
})

test_that("Passes through a supplied settings JSON string unchanged", {
    settings <- '{"variableImage":"circle:horizontal:blue","percentage":"0.4","width":400,"height":400}'

    g <- rhtmlPictographs::graphic(settings)

    expect_equal(g$x, settings)
})

test_that("Accepts a non-JSON / malformed string without erroring", {
    settings <- "not json"

    expect_error(g <- rhtmlPictographs::graphic(settings), NA)
    expect_equal(g$x, settings)
})
