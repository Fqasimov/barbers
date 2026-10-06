import { useState } from 'react';

import type { Check } from './validation';

/**
 * Tiny form helper: values, per-field validators, and errors that appear on
 * submit and then update live as the user corrects each field.
 */
export function useForm<K extends string>(
  initial: Record<K, string>,
  rules: Partial<Record<K, (v: string, all: Record<K, string>) => Check>>,
) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<K, Check>>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = (vals: Record<K, string>) => {
    const next: Partial<Record<K, Check>> = {};
    for (const k of Object.keys(rules) as K[]) next[k] = rules[k]!(vals[k], vals);
    return next;
  };

  const set = (k: K) => (v: string) => {
    const vals = { ...values, [k]: v };
    setValues(vals);
    if (submitted) setErrors(validate(vals));
  };

  /** Validates everything; returns true when the form is clean. */
  const check = () => {
    setSubmitted(true);
    const next = validate(values);
    setErrors(next);
    return Object.values(next).every((e) => !e);
  };

  return { values, set, errors, check, setErrors };
}
