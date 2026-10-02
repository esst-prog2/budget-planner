## Purpose

Lets the user set up a month's budget by entering income and must-pay expenses, seeing what is left to plan, and manually planning the fixed flexible categories.

## ADDED Requirements

### Requirement: Enter monthly income
The system SHALL let the user enter a single income amount for the current month.

#### Scenario: User enters income
- **WHEN** the user enters an income amount for the month
- **THEN** the system stores it as that month's income

### Requirement: Enter must-pay expenses
The system SHALL let the user enter amounts for exactly three fixed must-pay expenses: rent, phone, and transport.

#### Scenario: User enters must-pay amounts
- **WHEN** the user enters amounts for rent, phone, and transport
- **THEN** the system stores each amount against its fixed must-pay label

### Requirement: Show remaining amount after must-pays
The system SHALL calculate and display the amount left to plan as the carried-over amount from the previous month plus income minus the sum of the three must-pay expenses.

#### Scenario: Remaining amount example
- **WHEN** the carried-over amount is 0, income is 1200, and must-pays are rent 650, phone 20, and transport 49
- **THEN** the system shows 481 as the amount left to plan

### Requirement: Fixed flexible categories
The system SHALL provide exactly six fixed flexible categories: food, clothes, gym, subscriptions, going out, and other. The system SHALL NOT allow the user to create, rename, or delete categories.

#### Scenario: Category list is fixed
- **WHEN** the user views the list of flexible categories
- **THEN** the system shows exactly food, clothes, gym, subscriptions, going out, and other, with no option to add a new one

### Requirement: Manually plan each flexible category
The system SHALL let the user enter a plan amount for each of the six flexible categories, starting from an empty value with no suggested amount.

#### Scenario: User plans a category
- **WHEN** the user enters a plan amount for a flexible category
- **THEN** the system stores that amount as the category's plan for the current month
