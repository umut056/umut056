export const measuresOf = (text = "") => [
  ...new Set(
    (text.match(/\d+\s*(?:ml|kapak|çay kaşığı|tatlı kaşığı|yemek kaşığı|çorba kaşığı|tepeleme çorba kaşığı|kaşık|adet|avuç)/gi) || [])
      .map((value) => value.replace(/\s+/g, " ").trim())
  ),
];

export const estimateBody = (input = {}) => {
  const height = Number(input.height) || 0;
  const weight = Number(input.weight || input.current) || 0;
  const age = Number(input.age) || 0;
  const gender = input.gender || "female";
  const bmi = height && weight ? +(weight / ((height / 100) ** 2)).toFixed(1) : 0;
  const fatRaw = bmi && age ? 1.2 * bmi + 0.23 * age - 10.8 * (gender === "male" ? 1 : 0) - 5.4 : 0;
  const fat = Math.max(8, Math.min(55, +(fatRaw || 0).toFixed(1)));
  const idealLow = height ? +(18.5 * ((height / 100) ** 2)).toFixed(1) : 0;
  const idealHigh = height ? +(24.9 * ((height / 100) ** 2)).toFixed(1) : 0;
  const target = height ? +(22 * ((height / 100) ** 2)).toFixed(1) : 0;
  const excess = weight && idealHigh ? +Math.max(0, weight - idealHigh).toFixed(1) : 0;
  const water = fat ? +(gender === "male" ? 66 - fat * 0.45 : 60 - fat * 0.42).toFixed(1) : 0;
  const muscle = fat ? +(gender === "male" ? 48 - fat * 0.18 : 42 - fat * 0.15).toFixed(1) : 0;

  return {
    bmi,
    fat,
    ideal: `${idealLow || "-"}-${idealHigh || "-"} kg`,
    target,
    excess,
    water,
    muscle,
  };
};
