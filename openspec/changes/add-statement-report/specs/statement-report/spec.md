## Purpose

Lets the user import a bank deposit statement and see their spending per category and month, with this month's spending added to the planner.

## ADDED Requirements

### Requirement: Read a statement in the browser
The system SHALL read a deposit statement (.xlsx) chosen by the user without sending it anywhere, taking every dated row below the header row as a transaction.

#### Scenario: Statement with a total row
- **WHEN** the user picks a statement with 10 dated transactions and a "Нийт:" total row
- **THEN** the system reads 10 transactions and ignores the title and total rows

#### Scenario: A file that is not a statement
- **WHEN** the user picks a file that cannot be read as a statement
- **THEN** the system says so and changes nothing

### Requirement: Only purchases and fees count as spending
The system SHALL treat money in and transfers to people or own accounts as not spending, and every other outgoing transaction (purchases, QPay/Happy Pay payments, bank fees) as spending.

#### Scenario: Money sent to a person
- **WHEN** the statement has a 300 transfer to a person in October
- **THEN** the report shows 300 under transfers out for October and does not add it to spending

### Requirement: Categories by shop name
The system SHALL put spending into food, clothes, gym, subscriptions or going out when its description contains a known shop name at the start of a word, and into "other" otherwise.

#### Scenario: Purchase without a shop name
- **WHEN** a purchase only says "POS Normal Purchase"
- **THEN** it is counted under "other"

### Requirement: Monthly report
The system SHALL show, for each month in the statement, the spending per category, the total spending, transfers out and money in, and keep this report after the page is reloaded.

#### Scenario: October in the report
- **WHEN** the statement has October spending of food 120 and other 45
- **THEN** the October column shows Food 120, Other 45 and Spending 165

### Requirement: This month's spending feeds the planner once
The system SHALL add the spending of the planner's current month to each category's actual amount, and SHALL NOT add the same transaction again when a statement is imported twice.

#### Scenario: Importing the same statement twice
- **WHEN** a statement with 130.5 of November food spending is imported twice in November
- **THEN** food's actual amount goes up by 130.5 only once
