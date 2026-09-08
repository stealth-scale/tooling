# @stealthscale/core-schema

A **library**: it owns valibot, which the rest must not carry.

Validation and parsing for every tier. Schemas, the actions that go beyond what valibot
ships, and the parsing helpers a config, a manifest reader and a request handler all need.

A custom validation is a valibot action with a `type` of its own — `calendar_day`,
`navigable_url` — and **no message**. A library ships codes, not words: the code is what a
catalogue translates and the language's default text is what a log reads.

## Install

```sh
bun add @stealthscale/core-schema
```
