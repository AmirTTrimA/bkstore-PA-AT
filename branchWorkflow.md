# Git Feature Branch Workflow

This document describes the recommended Git workflow for this project.
It is intended for both current and future contributors.

------------------------------------------------------------------------

## Branch Strategy

-   `main` -- Stable project branch.
-   `dev` -- Integration branch where completed features are merged.
-   `feat/<feature-name>` -- One branch per feature or task.

Example:

``` text
main
└── dev
    ├── feat/search
    ├── feat/pricing
    └── feat/checkout
```

------------------------------------------------------------------------

## 1. Start a New Feature

Always start from an up-to-date `dev` branch.

``` bash
git switch dev
git pull
git switch -c feat/my-feature
```

------------------------------------------------------------------------

## 2. Work Normally

Commit as often as needed.

``` bash
git add .
git commit -m "feat(component): implement new functionality"
```

Push whenever you want a backup or need to collaborate.

``` bash
git push -u origin feat/my-feature
```

------------------------------------------------------------------------

## 3. Finish the Feature

Before merging, make sure everything is committed.

``` bash
git status
```

Expected output:

``` text
nothing to commit, working tree clean
```

Return to `dev`:

``` bash
git switch dev
git pull
```

Merge the feature:

``` bash
git merge feat/my-feature
```

If Git reports conflicts:

1.  Edit the conflicted files.
2.  Remove the conflict markers.
3.  Save the files.
4.  Finish the merge:

``` bash
git add .
git commit
```

Finally:

``` bash
git push origin dev
```

------------------------------------------------------------------------

## 4. Verify Before Deleting

### Branches already merged into the current branch

``` bash
git branch --merged
```

### Branches NOT merged

``` bash
git branch --no-merged
```

Only delete feature branches after confirming they are merged.

------------------------------------------------------------------------

## 5. Delete Merged Branches

### Delete local branch

``` bash
git branch -d feat/my-feature
```

> Use `-d`, not `-D`. Git will refuse to delete a branch that still
> contains unique commits.

### Delete remote branch

``` bash
git push origin --delete feat/my-feature
```

------------------------------------------------------------------------

# Useful Git Commands

## Repository status

``` bash
git status
```

## Show local branches

``` bash
git branch
```

## Show local branches with upstream information

``` bash
git branch -vv
```

## Show remote branches

``` bash
git branch -r
```

## Show merged branches

``` bash
git branch --merged
```

## Show unmerged branches

``` bash
git branch --no-merged
```

## Show remote branches already merged into `origin/dev`

``` bash
git branch -r --merged origin/dev
```

## View what will change before merging

``` bash
git diff dev..feat/my-feature
```

## View commits unique to a branch

``` bash
git log dev..feat/my-feature
```

## View the commit graph (recommended)

``` bash
git log --oneline --graph --decorate --all --simplify-by-decoration
```

This command provides an excellent overview of:

-   branch structure
-   merge history
-   tags
-   HEAD location
-   branch pointers

It is one of the most useful commands for understanding a repository.

------------------------------------------------------------------------

# Typical Workflow

``` text
git switch dev
git pull

git switch -c feat/new-feature

# work...

git add .
git commit

git push -u origin feat/new-feature

# feature complete

git switch dev
git pull
git merge feat/new-feature

git push origin dev

git branch --no-merged
git branch -d feat/new-feature
git push origin --delete feat/new-feature
```

------------------------------------------------------------------------

# Notes

-   Keep feature branches focused on a single task.
-   Merge into `dev` only after the feature is complete and tested.
-   Prefer local merges for solo development.
-   Use Pull Requests when code review or CI is required.
-   Delete merged feature branches to keep the repository clean.
