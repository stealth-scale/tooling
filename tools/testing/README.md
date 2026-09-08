# @stealthscale/tool-testing

A **kit**: a dev-time library another repository takes.

Builds a scratch workspace in the temporary directory, and writes the manifests that go in
it. A guard's spec, a package's spec and a repository's own conformance spec all reach for
the same two.

A spec that reads the real workspace states the rule and derives its expectation from the
tree. A spec that writes its own scratch workspace in `tmpdir` may pin exact counts and
names, because it wrote them.

## Install

```sh
bun add -d @stealthscale/tool-testing
```
