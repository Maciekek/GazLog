export const pln = (n: number) => n.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })
export const num = (n: number, d = 1) => n.toLocaleString('pl-PL', { maximumFractionDigits: d })
export const today = () => new Date().toISOString().slice(0, 10)
