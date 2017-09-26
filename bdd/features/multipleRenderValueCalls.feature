@applitools @rerender
Feature: Multiple Calls to Render Value
  Multiple calls to renderValue should leave the widget in a good state. Updates to the config should be rendered, and there should not be multiple widgets created or remnants of the original config left over.

  Scenario: Rerender Test
    Given I am viewing "two_blue_squares" with dimensions 300x100 and rerender controls
    Then the "two_blue_squares_300x100" snapshot matches the baseline
    When I rerender with config "three_red_circles"
    Then the "three_red_circles_300x100" snapshot matches the baseline
