import { useFetcher } from "react-router";

export function Search() {
  const fetcher = useFetcher();

  console.log("Fetcher data:", fetcher.data);

  return (
    <fetcher.Form method="get" action="/search">
      <input
        type="text"
        name="q"
        placeholder="Search vowels..."
        className="p--100 bd--s"
        onChange={(e) => {
          fetcher.submit(e.currentTarget.form);
        }}
      />
    </fetcher.Form>
  );
}
