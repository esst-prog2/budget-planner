## Purpose

Automatically starts a new month's budget when the calendar month changes, carrying forward any money left unspent from the previous month.

## ADDED Requirements

### Requirement: Detect a new calendar month automatically
The system SHALL detect, without requiring a manual action from the user, when the real-world calendar month has changed since the data was last saved, and SHALL start a fresh month at that point.

#### Scenario: Opening the app in a new month
- **WHEN** the user opens the app and the current calendar month differs from the month stored in the saved data
- **THEN** the system starts a new month's budget

### Requirement: Carry over leftover income
The system SHALL calculate the leftover amount from the previous month as that month's carried-over amount plus income minus must-pays minus recorded actual expenses across all flexible categories. The system SHALL keep the leftover as the new month's carried-over amount, separate from the income field, and SHALL add it to whatever income the user enters for the new month.

#### Scenario: Leftover rolls into next month
- **WHEN** the previous month ends with leftover unspent money
- **THEN** the system adds that leftover amount to the income entered for the new month

#### Scenario: Entering the new income keeps the leftover
- **WHEN** September ends with a carried-over amount of 0, income 1200, must-pays totalling 719, and 300 spent, and the user enters income 1200 for October
- **THEN** October's carried-over amount is 181 and the amount left to plan is 1381

### Requirement: Fresh state each month
The system SHALL reset the income, the three must-pay amounts, and all six flexible categories' plans and actual spending to empty at the start of a new month; only the carried-over amount, shown separately from income, holds a value: the previous month's leftover.

#### Scenario: New month starts empty except income
- **WHEN** a new month starts
- **THEN** income, must-pay amounts and all six flexible categories show no value, while the carried-over amount shows the previous month's leftover
