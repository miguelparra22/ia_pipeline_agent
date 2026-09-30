/**
 * HU-004: usuario por defecto hardcodeado (mock, no autenticación real). No hay backend de
 * usuarios; ver design.md de `hu-004-login-usuario-por-defecto` para el alcance y sus riesgos.
 */
export const DEFAULT_USER = {
  username: 'admin',
  password: 'admin123', // ejemplo-de-gate: usuario por defecto de HU-004, no es una clave real
};
