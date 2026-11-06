export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '';

  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return '';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();

  // Takes the first letter of the first name and the last name
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};