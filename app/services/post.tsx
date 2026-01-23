export async function getDataBySlug(slug: string) {
  const response = await fetch(`https://swapi.dev/api/people/${slug}`);
  const data = await response.json();
  return data;
}
