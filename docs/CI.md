# Continuous integration

`Frontend CI` runs for pull requests targeting `staging` or `main`, and again after changes land on either branch. Feature branches should be created from the latest `staging` and merged through pull requests.

The checks are `lint`, `type-check`, `tests`, `build`, and `dependency-audit`. CI uses a local placeholder backend URL for the production build and does not require a database or deployment secrets.

The checked-in ESLint suppressions capture existing violations only. New errors still fail immediately, and the 38-warning ceiling prevents the warning count from increasing while the team pays down the baseline.
