export function isMobile(userAgent = "") {
  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent
  );
}
