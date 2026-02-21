import type { FC, ComponentPropsWithoutRef } from "react";

type HomeProps = ComponentPropsWithoutRef<"svg">;

const Home: FC<HomeProps> = ({
  className = "",
  "aria-hidden": ariaHidden = true,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="800"
    height="800"
    fill="none"
    viewBox="0 0 24 24"
    className={`icon ${className}`}
    aria-hidden={ariaHidden}
  >
    <path
      fill="#000"
      fillRule="evenodd"
      d="M12.614 1.21a1 1 0 0 0-1.228 0l-9 7A1 1 0 0 0 2 9v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a1 1 0 0 0-.386-.79zM16 20h4V9.49l-8-6.223-8 6.222V20h4v-8a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1zm-6 0v-7h4v7z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default Home;
