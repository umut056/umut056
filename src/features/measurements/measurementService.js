export const bodyDefaults = {
  height: 0,
  age: 0,
  gender: "female",
  start: 0,
  current: 0,
  target: 0,
  water: 0,
  fat: 0,
  muscle: 0,
  bmi: 0,
  waist: 0,
  hip: 0,
  chest: 0,
  excess: 0,
  ideal: "-",
};

const numericKeys = [
  "height",
  "age",
  "start",
  "current",
  "target",
  "water",
  "fat",
  "muscle",
  "bmi",
  "waist",
  "hip",
  "chest",
  "excess",
];

export function normalizeBody(body = {}) {
  const next = { ...bodyDefaults, ...body };
  numericKeys.forEach((key) => {
    next[key] = Number.isFinite(Number(next[key])) ? Number(next[key]) : 0;
  });
  next.gender = next.gender || bodyDefaults.gender;
  next.ideal = next.ideal || bodyDefaults.ideal;
  return next;
}

export const applyBodyEstimateToDraft = (draft, estimate) => ({
  ...draft,
  bmi: estimate.bmi,
  fat: estimate.fat,
  water: estimate.water,
  muscle: estimate.muscle,
  target: estimate.target || draft.target,
  ideal: estimate.ideal,
  excess: estimate.excess,
});
