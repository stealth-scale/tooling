/**
 * @fileoverview The shape every tier uses to answer "it worked" or "it did not" without
 * throwing: a discriminated union a caller narrows on `ok`, and the combinators that carry a
 * value through a chain of steps without unwrapping it at each one.
 */

/**
 * Carries the value of a step that worked.
 *
 * @template Value - What the step produced.
 */
export interface Success<Value> {
  /**
   * Marks the success; a caller narrows on it.
   */
  readonly ok: true

  /**
   * Holds what the step produced.
   */
  readonly value: Value
}

/**
 * Carries the reason a step did not work.
 *
 * @template Failure - What the step reports when it refuses: an issue list, a code, an error.
 */
export interface Refusal<Failure> {
  /**
   * Holds why the step refused. It is never an exception a caller has to catch.
   */
  readonly failure: Failure

  /**
   * Marks the refusal; a caller narrows on it.
   */
  readonly ok: false
}

/**
 * What a step gives back: the value, or the reason it refused.
 *
 * A function returns this rather than throwing when refusing is an ordinary outcome the
 * caller handles — a boundary that rejects input, a lookup that finds nothing, a step that
 * cannot run yet. It throws only for a fault the caller cannot do anything about.
 *
 * @template Value - What the step produces when it works.
 * @template Failure - What it reports when it refuses.
 */
export type Result<Value, Failure> = Refusal<Failure> | Success<Value>

// jsdoc's type parser reads a `readonly` prefix only at the top level of a type, so a tag
// cannot spell `Result<readonly Value[], readonly Failure[]>` and `collect` names it instead.
/**
 * Names what `collect` answers: every value when each step worked, or every reason when
 * any refused.
 *
 * @template Value - What each step produces.
 * @template Failure - What each reports when it refuses.
 */
export type Collected<Value, Failure> = Result<readonly Value[], readonly Failure[]>

/**
 * Builds the result of a step that worked.
 *
 * @template Value - What the step produced.
 * @param {Value} value - The value to carry.
 * @returns {Success<Value>} The success, narrowed so `ok` is the literal `true`.
 */
export function succeeded<Value>(value: Value): Success<Value> {
  return { ok: true, value }
}

/**
 * Builds the result of a step that refused.
 *
 * @template Failure - What the step reports.
 * @param {Failure} failure - The reason to carry.
 * @returns {Refusal<Failure>} The refusal, narrowed so `ok` is the literal `false`.
 */
export function refused<Failure>(failure: Failure): Refusal<Failure> {
  return { failure, ok: false }
}

/**
 * Reads the value, falling back where the step refused.
 *
 * @template Value - What the step produces.
 * @template Failure - What it reports when it refuses.
 * @param {Result<Value, Failure>} result - The result to read.
 * @param {Value} fallback - The value to use instead of a refusal.
 * @returns {Value} The carried value, or the fallback.
 */
export function valueOr<Value, Failure>(result: Result<Value, Failure>, fallback: Value): Value {
  return result.ok ? result.value : fallback
}

/**
 * Applies a function to the value, leaving a refusal untouched.
 *
 * @template Value - What the step produced.
 * @template Mapped - What the function produces.
 * @template Failure - What the step reports when it refuses.
 * @param {Result<Value, Failure>} result - The result to map.
 * @param {(value: Value) => Mapped} change - Runs on the value of a success, and never on a refusal.
 * @returns {Result<Mapped, Failure>} The mapped success, or the same refusal.
 */
export function mapValue<Value, Mapped, Failure>(
  result: Result<Value, Failure>,
  change: (value: Value) => Mapped,
): Result<Mapped, Failure> {
  return result.ok ? succeeded(change(result.value)) : result
}

/**
 * Applies a function to the reason, leaving a success untouched. A boundary uses it to
 * restate a lower layer's refusal in its own terms.
 *
 * @template Value - What the step produces.
 * @template Failure - What it reports when it refuses.
 * @template Mapped - What the function produces.
 * @param {Result<Value, Failure>} result - The result to map.
 * @param {(failure: Failure) => Mapped} change - Runs on the reason of a refusal, and never on a success.
 * @returns {Result<Value, Mapped>} The same success, or the mapped refusal.
 */
export function mapFailure<Value, Failure, Mapped>(
  result: Result<Value, Failure>,
  change: (failure: Failure) => Mapped,
): Result<Value, Mapped> {
  return result.ok ? result : refused(change(result.failure))
}

/**
 * Runs the next step only where the one before it worked, so a chain stops at the first
 * refusal and carries it out.
 *
 * @template Value - What the step produced.
 * @template Next - What the following step produces.
 * @template Failure - What either step reports when it refuses.
 * @param {Result<Value, Failure>} result - The result of the step before.
 * @param {(value: Value) => Result<Next, Failure>} step - Runs on the value of a success, and never on a refusal.
 * @returns {Result<Next, Failure>} The following step's result, or the refusal that stopped
 *     the chain before it ran.
 */
export function andThen<Value, Next, Failure>(
  result: Result<Value, Failure>,
  step: (value: Value) => Result<Next, Failure>,
): Result<Next, Failure> {
  return result.ok ? step(result.value) : result
}

/**
 * Turns a list of results into one result of a list, reporting every refusal rather than the
 * first. A caller validating many fields shows a person all of them at once.
 *
 * @template Value - What each step produces.
 * @template Failure - What each reports when it refuses.
 * @param {readonly Result<Value, Failure>[]} results - The results to collect, in the order the caller made them.
 * @returns {Collected<Value, Failure>} Every value in order when all worked, and otherwise
 *     every reason in order. An empty list succeeds with an empty list.
 */
export function collect<Value, Failure>(
  results: readonly Result<Value, Failure>[],
): Collected<Value, Failure> {
  const values: Value[] = []
  const failures: Failure[] = []

  for (const result of results) {
    if (result.ok) values.push(result.value)
    else failures.push(result.failure)
  }

  return failures.length > 0 ? refused(failures) : succeeded(values)
}
