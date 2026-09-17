const alertCooldowns = new Map();

export function canAlert(
  alertKey,
  cooldown = 5000
) {
  const now = Date.now();

  const last =
    alertCooldowns.get(
      alertKey
    ) || 0;

  if (
    now - last <
    cooldown
  ) {
    return false;
  }

  alertCooldowns.set(
    alertKey,
    now
  );

  return true;
}

export function clearAlerts() {
  alertCooldowns.clear();
}
