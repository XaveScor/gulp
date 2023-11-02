const deprecationFlagsEnum = {
  'legacyTask': 'legacyTask',
};
const deprecationFlagsDefaults = {
  [deprecationFlagsEnum.legacyTask]: false,
};
class Deprecations {
  _flags = structuredClone(deprecationFlagsDefaults);

  reset() {
    this._flags = structuredClone(deprecationFlagsDefaults);
  }

  /**
   *
   * @param flags {{ legacyTask: boolean }}
   */
  disableBehavior(flags) {
    this._flags = {
      ...deprecationFlagsDefaults,
      ...flags,
    };
  }

  deprecate(flag, message) {
    if (this._flags[flag]) {
      throw new Error(`Feature ${flag} is disabled. Message: ${message}`);
    }
  }
}

class DeprecationWarnings {
  _disabled = new Set();

  /**
   *
   * @param flags {Array<string>}
   */
  disableDeprecationWarnings(flags) {
    flags.forEach((flag) => this._disabled.add(flag));
  }

  warn(flag, message) {
    if (this._disabled.has(flag)) {
      return;
    }
    console.warn(`[${flag}]`, message);
  }
}

module.exports = {
  deprecationFlagsEnum,
  Deprecations,
  DeprecationWarnings,
};
