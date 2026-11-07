## Purpose

Lets the user see every expense they recorded or imported, delete a wrong one, and look back at earlier months in a report that is always up to date.

## ADDED Requirements

### Requirement: Every expense is saved as an entry
The system SHALL save each expense with its date and time, category, amount and source (typed, statement, or before history), and SHALL compute each category's actual spending as the sum of its entries.

#### Scenario: Typing an expense
- **WHEN** the user records a 25 food expense on 2026-11-15 at 12:00:00
- **THEN** the history shows "2026-11-15 12:00:00, Food, 25, typed" at the top

### Requirement: Delete a wrong entry
The system SHALL let the user delete an entry of the current month and SHALL recalculate the totals, warnings and report.

#### Scenario: Deleting the expense that went over plan
- **WHEN** food's plan is 200, the entries are 190 and 25, and the user deletes the 25
- **THEN** food's actual spending is 190, the warning disappears and the report shows "190 / 200"

### Requirement: Finished months are kept
The system SHALL keep a finished month's income, must-pays, plans and entries at the month change, carry over its leftover as before, and show its entries without a way to delete them.

#### Scenario: Looking back at October in November
- **WHEN** October had income 1200, must-pays 719 and entries of 200 and 100, and the app is opened in November
- **THEN** November starts with 181 carried over, and choosing October in the history shows its two entries without delete buttons

### Requirement: Combined monthly report
The system SHALL show one report with a column per saved month: actual spending and plan per category, total spending, income and must-pays, marking a category over its plan; statement transfers and money in are listed but not counted as spending.

#### Scenario: Two saved months
- **WHEN** October is kept with spending 300 and November has none yet
- **THEN** the report has columns 2026-10 and 2026-11, with Spending 300 and 0

### Requirement: Spending saved before the history
The system SHALL turn each category total saved before the history existed into one entry marked "before history", so no spending is lost and it can be deleted like any other entry.

#### Scenario: Opening older saved data
- **WHEN** the saved month has food 40 and gym 15 but no entries
- **THEN** the history shows a Food 40 and a Gym 15 entry marked "before history"
