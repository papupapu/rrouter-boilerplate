import { Link } from "react-router";
import { Search } from "../../components/post/search/search";

interface PostProps {
  // Accept either the raw data or FetchResponse (for future compatibility)
  data: any;
}

export function Post({ data }: PostProps) {
  // Extract name from data (works with both old format and new FetchResponse)
  const name = data?.name || data?.data?.name || "Unknown";

  return (
    <main className="p--200">
      <div className="tp-w--s">post about: {name}</div>
      <Link to="/">Go to home page</Link>
      <Search />
    </main>
  );
}
