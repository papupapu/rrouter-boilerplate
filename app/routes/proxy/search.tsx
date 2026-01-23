const vowels = [
  {
    id: 1,
    letter: "A",
  },
  {
    id: 2,
    letter: "E",
  },
  {
    id: 3,
    letter: "I",
  },
  {
    id: 4,
    letter: "O",
  },
  {
    id: 5,
    letter: "U",
  },
];

export async function loader({ request }: { request: Request }) {
  await new Promise((res) => setTimeout(res, 300));
  let url = new URL(request.url);
  let query = url.searchParams.get("q") || "";
  return vowels.filter((vowel) =>
    vowel.letter.toLowerCase().includes(query.toLowerCase())
  );
}
