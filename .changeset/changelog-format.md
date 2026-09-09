---
'@stealthscale/tool-config': patch
---

Keeps a changelog out of the formatter and the linter. Changesets writes `CHANGELOG.md` in its own shape when it versions a package, and holding it to the formatter stops the release: the version commit lands on the default branch, the check refuses what changesets wrote, and the publish that only runs after a green check never runs.
