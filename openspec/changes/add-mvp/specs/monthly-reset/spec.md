## Purpose

Automatically starts a new month's budget when the calendar month changes, carrying forward any money left unspent from the previous month.

## ADDED Requirements

### Requirement: Detect a new calendar month automatically
The system SHALL detect, without requiring a manual action from the user, when the real-world calendar month has changed since the data was last saved, and SHALL start a fresh month at that point.

#### Scenario: Opening the app in a new month
- **WHEN** the user opens the app and the current calendar month differs from the month stored in the saved data
- **THEN** the system starts a new month's budget

### Requirement: Carry over leftover income
The system SHALL calculate the leftover amount from the previous month as income minus must-pays minus recorded actual expenses across all flexible categories, and SHALL add it to the new month's income as a starting value.

#### Scenario: Leftover rolls into next month
- **WHEN** the previous month ends with leftover unspent money
- **THEN** the system adds that leftover amount to the income entered for the new month

### Requirement: Fresh state each month
The system SHALL reset the three must-pay amounts and all six flexible categories' plans and actual spending to empty at the start of a new month; only the income field starts pre-filled, with the previous month's leftover amount.

#### Scenario: New month starts empty except income
- **WHEN** a new month starts
- **THEN** must-pay amounts and all six flexible categories show no value, while income starts with the previous month's leftover amount
