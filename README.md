![CI](https://github.com/nearform/bench-template/actions/workflows/ci.yml/badge.svg?event=push)

# UnbreakCI Project

## Main high level request here:
- GitHub app to automatically add broken dependabot bumps to the project board: https://github.com/nearform/bench-draft-issues/issues/107  
- "Dependabot is running in most of our repo with and our github action to automatically merge PRs is configured in the CI workflow: [https://github.com/fastify/github-action-merge-dependabot](https://github.com/fastify/github-action-merge-dependabot).  
	- Sometimes bumps are not automatically merged because the build breaks. In those cases we usually want to have a look at them to see how to fix them, but they often go unnoticed.  
	- We could create a GitHub app which subscribes to events so that when those PRs are not merged automatically, they are added to the board for manual inspection."  

## Project Board
https://github.com/orgs/nearform/projects/16/views/1

Repository based on the Bench Template:
A feature-packed template to start a new repository on the bench, including:

- code linting with [ESlint](https://eslint.org) and [prettier](https://prettier.io)
- pre-commit code linting and commit message linting with [husky](https://www.npmjs.com/package/husky) and [commitlint](https://commitlint.js.org/)
- dependabot setup with automatic merging thanks to ["merge dependabot" GitHub action](https://github.com/fastify/github-action-merge-dependabot)
- notifications about commits waiting to be released thanks to ["notify release" GitHub action](https://github.com/nearform/github-action-notify-release)
- PRs' linked issues check with ["check linked issues" GitHub action](https://github.com/nearform/github-action-check-linked-issues)
- Continuous Integration GitHub workflow

## When you have already a repo

If you already created a repo and you want to add some of the features above to it, you can have a look at [NearForm MRM Preset](https://github.com/nearform/mrm-preset-nearform).
