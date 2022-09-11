export function doBinarySearchApprox<T>(
  initialMultiple: number,
  calculationFunction: (multiple: number) => { actualMultiple: number; breakLoop: boolean; value: T },
  target: number,
  requiredPrecision: number,
  loopAdjustment = (m: number, d: number) => Math.floor(m + d / 2),
  maxIter = 10
) {
  let iters = 0;
  let delta = 0;
  let multiple = initialMultiple;

  do {
    const { actualMultiple, breakLoop, value } = calculationFunction(multiple);

    delta = target - actualMultiple;

    if (breakLoop || Math.abs(delta) < requiredPrecision) {
      return value;
    }

    multiple = loopAdjustment(multiple, delta); // Math.floor(multiple - delta * 2);
    iters += 1;
  } while (iters < maxIter);

  throw Error('Failed to converge');
}
