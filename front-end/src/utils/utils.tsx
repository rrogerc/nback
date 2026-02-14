// Get Score
// const getAlternativeScore = (TP, TN, FP, FN) => (((TP + TN) / (TP + TN + FP + FN)) * 100).toFixed(2);
export const getScore = (TP: number, FP: number, FN: number) =>
  Number(
    TP ? ((TP / (TP + FP + FN)) * 100).toFixed(2) : FP || FN ? 0.0 : 100.0
  );

// Random Integer Function
export const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min);

export const prettyDate = (a: string) => {
  const b = new Date(a),
    c = (new Date().getTime() - b.getTime()) / 1e3,
    d = Math.floor(c / 86400);
  if (isNaN(d) || 0 > d || 31 <= d) return b.toString().slice(0, 21);
  const h =
    (0 === d &&
      ((60 > c && "Just now") ||
        (120 > c && "1 minute ago") ||
        (3600 > c && Math.floor(c / 60) + " minutes ago") ||
        (7200 > c && "1 hour ago") ||
        (86400 > c && Math.floor(c / 3600) + " hours ago"))) ||
    b.toString().slice(0, 21);
  return h;
};

export const colorScheme = () => {
  return {
    colorScheme:
      localStorage.getItem("light") &&
      Boolean(Number(localStorage.getItem("light")))
        ? "light"
        : "dark",
  };
};
