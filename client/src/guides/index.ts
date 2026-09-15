export type GuideMeta = { slug: string; title: string; description: string; published: string; readingMinutes: number }

export const GUIDES: GuideMeta[] = [
  {
    slug: 'ile-kosztuje-instalacja-lpg-i-kiedy-sie-zwraca',
    title: 'Ile kosztuje instalacja LPG i kiedy się zwraca?',
    description:
      'Orientacyjne ceny montażu instalacji gazowej, ukryte koszty eksploatacji i prosty wzór na to, po ilu kilometrach gaz zaczyna zarabiać na siebie.',
    published: '2026-09-15',
    readingMinutes: 7,
  },
  {
    slug: 'lpg-czy-benzyna-kalkulator',
    title: 'LPG czy benzyna? Kalkulator kosztu na 100 km',
    description:
      'Porównaj koszt przejechania 100 km na gazie i na benzynie. Kalkulator uwzględnia wyższe spalanie LPG i pokazuje realną oszczędność na litrze i na roku.',
    published: '2026-09-15',
    readingMinutes: 5,
  },
  {
    slug: 'jak-liczyc-spalanie-lpg',
    title: 'Jak liczyć spalanie na LPG? Metoda „do pełna” i typowe błędy',
    description:
      'Jak wiarygodnie zmierzyć spalanie gazu, dlaczego komputer pokładowy kłamie na LPG i skąd bierze się 15–25% różnicy względem benzyny.',
    published: '2026-09-15',
    readingMinutes: 6,
  },
]
