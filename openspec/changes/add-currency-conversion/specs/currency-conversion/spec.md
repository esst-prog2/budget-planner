## Purpose

Lets the user keep one budget in HUF while spending in other currencies.

## ADDED Requirements

### Requirement: Exchange rates typed by the user
The system SHALL let the user enter, for MNT, EUR and USD, how many HUF one unit is worth, keep every decimal of the rate, and save the rates.

#### Scenario: A precise rate
- **WHEN** the user enters 1 MNT = 0.1087 HUF and records a 1000 MNT expense
- **THEN** the expense counts as 108.7 HUF

### Requirement: Expense in another currency
The system SHALL let the user choose the currency of a typed expense and SHALL count its value in HUF, showing the original amount next to it in the history.

#### Scenario: Paying in euros
- **WHEN** 1 EUR = 400 HUF and the user records a 10 EUR food expense
- **THEN** food's actual spending goes up by 4000 and the history shows "4000 (10 EUR)"

### Requirement: Today's rate for every month
The system SHALL convert every entry with the current rate, so a rate change updates all months.

#### Scenario: The euro rate changes
- **WHEN** October has a 20 EUR entry and the EUR rate changes from 400 to 410
- **THEN** October's report shows 8200 instead of 8000

### Requirement: Statement amounts are in MNT
The system SHALL convert imported purchases, transfers and money in from MNT.

#### Scenario: Importing with a rate of 0.1
- **WHEN** 1 MNT = 0.1 HUF and the statement has November food purchases of 500 and 250 MNT
- **THEN** November's food spending is 75

### Requirement: A missing rate is never silent
The system SHALL refuse a typed expense in a currency without a rate and say why, and SHALL keep imported entries without a rate, counted as 0, with a warning naming the missing rate until it is entered.

#### Scenario: Import before the MNT rate is set
- **WHEN** a statement is imported while no MNT rate is set
- **THEN** its purchases are kept, food's actual spending stays 0, and a warning asks for the MNT rate; entering the rate counts them
