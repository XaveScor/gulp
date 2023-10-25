# Jobo deprecations

## Project Goals

Our primary objective is to maintain a stable and reliable API. We understand the importance of your time and investment, and we strive to minimize disruptive changes.

However, there may be instances where making breaking changes becomes necessary to enhance the API. In such cases, we are committed to making the transition as smooth as possible.

To manage changes, we adhere to the principles of [Semantic Versioning](http://semver.org/). This ensures that you can anticipate and prepare for breaking modifications.

## Deprecation Process

Each deprecation within our project follows a structured four-stage process:

- **1/4 Discussing** - In this stage, we plan to deprecate a particular feature, but it is open to discussion and potential rejection. We consolidate all deprecation-related information into a single file to facilitate easy access and discussion.
- **2/4 Deprecated** - At this point, we begin displaying deprecation warnings in the console. You have the option to disable these warnings by using the `disableWarnings` function. However, we recommend addressing the warnings rather than silencing them. You can also disable legacy behavior using the `disableBehavior` function.
- **3/4 Disabled** - The deprecated code is disabled in this stage. By default, it will no longer function, but you can enable it by using the `disableBehavior` function.
- **4/4 Removed** - In the final stage, we completely remove the deprecated code from the project.

Our commitment is to keep deprecated code available for at least two major versions to ease your transition.

## Deprecations

### jobo.task

**Stage:** 2/4 Deprecated

**Deprecation flag:** `legacy-task`

**Deprecation schedule:**

| Stage      | Version |
|------------|---------|
| Deprecated | v5.2.0  |
| Disabled   | v6.0.0  |
| Removed    | v7.0.0  |

The `jobo.task` declaration, which uses `jobo.task(<name>, <task body>)`, is now deprecated due to the following reasons:

- The task's signature is not extendable, making it impossible to add new parameters without breaking the API.
- `jobo.task` executes the task body on every call, which negatively impacts performance by preventing result caching.
- `jobo.task` can redeclare tasks if the name is duplicated, which hinders debugging.
- `jobo.task` allows for a callback style, resulting in code that is hard to understand. It is recommended to use the async-await or promise style instead.
- `jobo.task` also permits obtaining the function by calling `jobo.task(<name>)`, which is considered an excess feature. You can define pipelines using names instead of functions.

The new and improved way to declare tasks is to use `jobo.declareTask({name, fn})`, which addresses these issues.

#### Migration Path

To migrate, you can simply replace instances of `jobo.task` with `jobo.declareTask` in most cases.

If you need to call the same task twice in the pipeline, create two identical tasks with different names.

If you have tasks with the same name, please use different names to avoid conflicts.

For callback style functions, you can replace them with the following code:

```javascript
new Promise((resolve, reject) => {
  async_callback_function((error, result) => {
    if (error) {
      reject(error);
    } else {
      resolve(result)
    }
  })
})
```
Alternatively, you can use require('util').promisify if applicable.

If you pass functions to jobo.series or jobo.parallel, create a task for them. Here's an example:
```javascript
const task1 = jobo.declareTask({
  name: 'task1',
  fn,
})

jobo.series(task1)
```
