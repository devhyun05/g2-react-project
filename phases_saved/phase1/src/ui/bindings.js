export function createButtonBinding(button, onClick) {
  button.addEventListener("click", onClick);
  return () => button.removeEventListener("click", onClick);
}

