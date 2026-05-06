export function showToast(message: string, duration = 2000): void {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add('toast--visible');
    });
  });

  setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.classList.add('toast--hiding');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

export function showTicketToast(count = 1): void {
  showToast(`🎫 응모권 +${count}`, 2000);
}
