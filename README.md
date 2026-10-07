# PackPick

Unofficial NC State quizzes that match you to a meal plan and housing. Not affiliated with NC State University; confirm prices and rules with University Dining and University Housing.

Plain HTML, CSS and native ES modules. No build step, no dependencies.

## Run locally
ES modules don't load from `file://`, so serve the folder:

    npx serve .

## Deploy (Vercel)
Import the GitHub repo, choose the **Other** framework preset, leave the build command and output directory empty, and deploy.

## Layout
- `index.html`, `css/` – page and styles
- `js/data/` – meal plan and housing data and question trees
- `js/` – state, quiz flow, scoring/results, history, profile, views
- `tests/` – logic tests (`npm test`)

Profile and quiz history are stored in the browser (`localStorage`).
