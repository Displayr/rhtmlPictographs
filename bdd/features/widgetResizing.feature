@applitools @resize
Feature: Calls to Resize
  Resize functions correctly. In this test A) flexible cell dimensions, B) constant font size, C) table alignment

  Scenario: Basic Resizing Test
    Given I am viewing "two_blue_squares" with dimensions 300x100
    Then the "two_blue_squares_300x100" snapshot matches the baseline
    When I resize the widget to 600x200
    Then the "two_blue_squares_600x200" snapshot matches the baseline

  Scenario: Complex Resizing Test (top left orientation)
    Given I am viewing "flexible_table_lots_of_labels_circles_and_urls_top_left_oriented" with dimensions 200x600 and a border
    Then the "flexible_table_lots_of_labels_circles_and_urls_top_left_oriented_200x600" snapshot matches the baseline
    When I resize the widget to 400x600
    Then the "flexible_table_lots_of_labels_circles_and_urls_top_left_oriented_400x600" snapshot matches the baseline
    When I resize the widget to 600x600
    Then the "flexible_table_lots_of_labels_circles_and_urls_top_left_oriented_600x600" snapshot matches the baseline
    When I resize the widget to 800x600
    Then the "flexible_table_lots_of_labels_circles_and_urls_top_left_oriented_800x600" snapshot matches the baseline
    When I resize the widget to 800x400
    Then the "flexible_table_lots_of_labels_circles_and_urls_top_left_oriented_800x400" snapshot matches the baseline
    When I resize the widget to 800x200
    Then the "flexible_table_lots_of_labels_circles_and_urls_top_left_oriented_800x200" snapshot matches the baseline


  Scenario: Complex Resizing Test (centered orientation)
    Given I am viewing "flexible_table_lots_of_labels_circles_and_urls_centered" with dimensions 200x600 and a border
    Then the "flexible_table_lots_of_labels_circles_and_urls_centered_200x600" snapshot matches the baseline
    When I resize the widget to 400x600
    Then the "flexible_table_lots_of_labels_circles_and_urls_centered_400x600" snapshot matches the baseline
    When I resize the widget to 600x600
    Then the "flexible_table_lots_of_labels_circles_and_urls_centered_600x600" snapshot matches the baseline
    When I resize the widget to 800x600
    Then the "flexible_table_lots_of_labels_circles_and_urls_centered_800x600" snapshot matches the baseline
    When I resize the widget to 800x400
    Then the "flexible_table_lots_of_labels_circles_and_urls_centered_800x400" snapshot matches the baseline
    When I resize the widget to 800x200
    Then the "flexible_table_lots_of_labels_circles_and_urls_centered_800x200" snapshot matches the baseline

  Scenario: Complex Resizing Test Using Flip Usecase (top left orientation)
    Given I am viewing "flip_usecase_barchart_of_sqaures_variable_number_of_rows_per_cell" with dimensions 200x600 and a border
    Then the "flip_usecase_barchart_of_sqaures_variable_number_of_rows_per_cell_200x600" snapshot matches the baseline
    When I resize the widget to 400x600
    Then the "flip_usecase_barchart_of_sqaures_variable_number_of_rows_per_cell_400x600" snapshot matches the baseline
    When I resize the widget to 600x600
    Then the "flip_usecase_barchart_of_sqaures_variable_number_of_rows_per_cell_600x600" snapshot matches the baseline
    When I resize the widget to 800x600
    Then the "flip_usecase_barchart_of_sqaures_variable_number_of_rows_per_cell_800x600" snapshot matches the baseline
    When I resize the widget to 800x400
    Then the "flip_usecase_barchart_of_sqaures_variable_number_of_rows_per_cell_800x400" snapshot matches the baseline
    When I resize the widget to 800x200
    Then the "flip_usecase_barchart_of_sqaures_variable_number_of_rows_per_cell_800x200" snapshot matches the baseline
