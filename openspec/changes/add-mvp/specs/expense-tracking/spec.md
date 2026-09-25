## Purpose

Lets the user record actual spending against a category and see, at a glance, whether each category is within its plan or over it.

## ADDED Requirements

### Requirement: Record an actual expense
The system SHALL let the user record an actual expense by choosing one of the six fixed flexible categories and entering an amount.

#### Scenario: Recording a grocery expense
- **WHEN** the user records a 25 expense in the food category
- **THEN** the system adds 25 to food's actual spending total

### Requirement: Unmatched expenses fall back to Other
The system SHALL record any expense that does not belong to food, clothes, gym, subscriptions, or going out under the "other" category.

#### Scenario: Expense with no matching category
- **WHEN** the user records an expense that does not match food, clothes, gym, subscriptions, or going out
- **THEN** the system adds it to the "other" category's actual spending total

### Requirement: Show plan vs. actual per category
The system SHALL display, for each flexible category, the planned amount, the actual amount spent, and a progress bar showing actual spending as a proportion of the plan.

#### Scenario: Category within plan
- **WHEN** a category's actual spending is less than or equal to its plan
- **THEN** the system shows the category's planned amount, actual amount, and a progress bar without a warning

### Requirement: Warn when a category exceeds its plan
The system SHALL show a warning naming the category and the amount by which it exceeds its plan whenever actual spending for that category passes the planned amount.

#### Scenario: Food goes over plan
- **WHEN** food's plan is 200 and recorded food spending is 190, and the user adds a 25 expense to food
- **THEN** the system shows a warning "Food: 15 over plan"
