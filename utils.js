export const currentDate = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
};

export const splitDate = () => {
  const now = currentDate();
  return now.match(/(\d{4})(\d{2})(\d{2})/).slice(1);
};
