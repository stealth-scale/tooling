---
'@stealthscale/tool-testing-react': minor
'@stealthscale/tool-config': patch
---

Adds `@stealthscale/tool-testing-react`, which reads a rendered component in a specification: `part` finds what a component drew through the slot it marked it with, `attr` and `renderedAs` read what became of it, and `describeContract` registers the suite every component owes whoever installs it.

It is a package rather than an entry of `@stealthscale/tool-testing`, because that one reads a workspace off the disk and should not have the document and the JSX runtime in scope to do it. One package compiles under one tsconfig, and the pack step writes a package's exports from the entries it built, so two surfaces are two packages.

`tool-config` learns `ParentNode`, which the docblock plugin cannot resolve for itself and every one of these helpers takes.
