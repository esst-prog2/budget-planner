# budget-planner
## What is this project?
Helps to manage student's budget and expenses
They can insert the incomes and the app shows must pay expenses(rent, phone, transport) first, then the user plans the additional expenses (food, clothes, gym, subscriptions, going out, other, unknown). Importantly, whenever the actual expense exceeds the plan, the app shows a warning inside the app.

## Who is it for?
Whoever wants to track their expenses, but mostly aiming for the international students across world.

## What problem does it solve?
Sometimes I forgot important events that I need to expense little bit lot. If I can adjust it in my budget planner already, I won't have any problem.

## Questions I needed to answer

Answered so far (details in PLANNING_LOG.md):

Should the budget reset automatically every month? Yes, and the leftover is carried over to the next month.
Should users be able to create their own expense categories? Not this term; seven fixed categories (the seventh, Unknown, holds imported purchases whose shop is not recognised).
What is the simplest way to display spending so that it is easy to understand? Plan vs. actual with a progress bar per category.
Should the application support multiple currencies? Partly: the budget is in HUF, and expenses in MNT, EUR or USD are converted with rates the user types in.
Should users be able to set savings goals? Not this term.

## The Size
First version does:
Enter monthly income (in HUF)
Enter fixed must-pay expenses: rent, phone, transport
Show what's left after must-pays
Plan amounts for a fixed set of flexible categories (food, clothes, gym, subscriptions, going out, other, unknown)
Record actual expenses against a category
Show a warning when a category's actual spending passes its plan
Start a fresh month (automatically)
Import a bank deposit statement (.xlsx); each purchase is saved in the history of its month, and this month's purchases and fees are added to the actual spending
Keep a history of every expense (typed or imported) with date and time; a wrong entry can be deleted
Keep every finished month and show one monthly report: actual / plan per category, income and must-pays
Convert expenses in MNT, EUR or USD into HUF with exchange rates the user types; the bank statement's MNT amounts are converted too

Explicitly not this term:

Income, must-pays and plans in other currencies; fetching exchange rates online
Savings goals
Custom categories
Push notifications (a warning shown inside the app is enough for December; phone notifications are a whole project of their own)
Planning for future one-off events (your original problem; see the note at the end)

## How we would know it works
Use the format given X, the program does Y, with real numbers:

Given income 1,200 and must-pays of rent 650, phone 20, and transport 49, the app shows 481 left to plan.
Given a food plan of 200 and recorded food spending of 190, adding an expense of 25 shows "Food: 15 over plan."
An edge case. Pick one and decide the answer:
End of month: on October 1, The app resets automatically, and the money left from September is carried over and added to October's income.
No category: the user puts it in "Other" (custom categories are not built this term).
Income entered twice: 1,200 entered twice on the same day. The app ask if it is correct or not? (backlog, not built yet)

## Demo
I open the app and enter this month's income: 1,200. I add rent 650, phone 20, transport 49. The screen shows 481 left. I plan food 200 and going out 50. Then I record a 25 grocery purchase that pushes food past its plan, and a red warning appears: Food: 15 over plan.

## Run it
Open `index.html` in a browser; there is no build step and no server. Data stays in the browser's localStorage.

To import a statement, pick the .xlsx file under "Import a bank statement". It is read in the browser only, and only date, category and amount of each purchase are saved. Shops are sorted by name (the list is `CATEGORY_KEYWORDS` in `statement.js`); purchases whose shop is not recognised go to Unknown, bank fees to Other. Keep real statements out of Git: `*.xlsx` is ignored.

Tests (Node.js 18 or newer, no dependencies): `node --test`
