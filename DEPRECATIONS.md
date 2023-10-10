# Jobo deprecations

## Deprecation policy

Our goals are make the stable and reliable API. We will try to avoid breaking changes as much as possible because We respect your time and money.

But sometimes we need to make breaking changes to improve the API. We will try to make the breaking changes as less painful as possible.

We will follow the [Semantic Versioning](http://semver.org/) to make the breaking changes.

Every deprecation have 3 stages:

- **Deprecated** - We will show the deprecated warning in the console.
- **Disabled** - We will disable the deprecated code. It will not work by default, but you can enable it by calling `setDeprecationFlags`
- **Removed** - We will remove the deprecated code.

We will try to keep the deprecated code for at least 2 major versions.

You always can disable the warnings by calling `disableWarnings`.


## Deprecations

### Task must run only once

Stage: **Deprecated**

Deprecation flag: `taskRunsOnce`

Deprecation schedule:

| Stage      | Version |
|------------|---------|
| Deprecated | v5.2.0  |
| Disabled   | v6.0.0  |
| Removed    | v7.0.0  |


The tasks must run only once even if they are called multiple times.

```js
async function task1() {
}

async function task2() {
}

series(
  task1,
  parallel(
    task1,
    task2
  )
)
```

In v5.1.2 this code will run `task1` twice. Starting from v5.2.0 it will run `task1` only once.

Migration path:
