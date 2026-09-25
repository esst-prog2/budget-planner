# budget-planner
## What is this project?
Helps to manage student's budget and expenses
They can insert the incomes and the app shows must pay expenses(rent, phone, transport) first, then app suggests the additional expenses (food, clothes, gym membership, subscriptions, night out etc) that user can adjust it. Importantly, whenever the actual expense exceeds the plan, the app send notification and remind it to the user.

## Who is it for?
Whoever wants to track their expenses, but mostly aiming for the international students across world.

## What problem does it solve?
Sometimes I forgot important events that I need to expense little bit lot. If I can adjust it in my budget planner already, I won't have any problem.

## Questions I still need to answer

There are several things I have not decided yet:

Should the budget reset automatically every month?
Should users be able to create their own expense categories?
What is the simplest way to display spending so that it is easy to understand?
Should the application support multiple currencies?
Should users be able to set savings goals?

## The Size
First version does:
Enter monthly income (one currency)
Enter fixed must-pay expenses: rent, phone, transport
Show what's left after must-pays
Plan amounts for a fixed set of flexible categories (food, clothes, gym, subscriptions, going out)
Record actual expenses against a category
Show a warning when a category's actual spending passes its plan
Start a fresh month (automatically)

Explicitly not this term:

Multiple currencies
Savings goals
Custom categories
Push notifications (a warning shown inside the app is enough for December; phone notifications are a whole project of their own)
Planning for future one-off events (your original problem; see the note at the end)

## How we would know it works
Use the format given X, the program does Y, with real numbers:

Given income 1,200 and must-pays of rent 650, phone 20, and transport 49, the app shows 481 left to plan.
Given a food plan of 200 and recorded food spending of 190, adding an expense of 25 shows "Food: 15 over plan."
An edge case. Pick one and decide the answer:
End of month: on October 1, The app resets automatically, but put the left amount of money from September into savings.
No category: the app put it in "Other", until the user creates a new category.
Income entered twice: 1,200 entered twice on the same day. The app ask if it is correct or not?

## Demo
I open the app and enter this month's income: 1,200. I add rent 650, phone 20, transport 49. The screen shows 481 left. The app suggests food 200, going out 80… I lower going out to 50. Then I record a 25 grocery purchase that pushes food past its plan, and a red warning appears: Food: 15 over plan.
