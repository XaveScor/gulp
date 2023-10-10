const deprecationFlagsDefaults = {
  taskRunsOnce: false,
};
let deprecationFlags = structuredClone(deprecationFlagsDefaults);

export function resetDeprecationFlags() {
  deprecationFlags = structuredClone(deprecationFlagsDefaults);
}

export function setDeprecationFlags(flags) {
  deprecationFlags = {
    ...deprecationFlagsDefaults,
    ...flags,
  };
}

export function getTaskRunsOnceDeprecationFlag() {
  return deprecationFlags.taskRunsOnce;
}

let logger = console.warn.bind(console);
export function warn(message) {
  logger(message);
}
export function disableDeprecationWarnings() {
  logger = () => {};
}

let deprecationWarningsShowed = false;
export function showDeprecationWarning() {
  if (deprecationWarningsShowed) {
    return;
  }
  deprecationWarningsShowed = true;

  if (!deprecationFlags.taskRunsOnce) {
    warn(
      '[WARNING] The calling mechanism of tasks will change in the future. Every task will be called only once, even if it is part of a series or parallel. See https://github.com/XaveScor/gulp/blob/master/DEPRECATIONS.md for more information.',
    );
  }
}
