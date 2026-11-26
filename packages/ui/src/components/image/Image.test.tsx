import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Image } from "./Image";

it("renders registered and secure remote image sources with required alt text", () => {
  const { rerender } = render(<Image asset="wordmark" alt="Academy logo" />);
  expect(screen.getByRole("img", { name: "Academy logo" })).toHaveAttribute("loading", "lazy");
  rerender(<Image remoteSrc="https://cdn.example.test/profile.png" alt="Teacher profile" />);
  expect(screen.getByRole("img", { name: "Teacher profile" })).toHaveAttribute(
    "referrerpolicy",
    "no-referrer",
  );
});

it("does not render remote images with unsafe or invalid protocols", () => {
  const { container, rerender } = render(
    <Image remoteSrc="javascript:alert(1)" alt="Unsafe image" />,
  );
  expect(container.querySelector("img")).toBeNull();
  rerender(<Image remoteSrc="http://cdn.example.test/profile.png" alt="Insecure image" />);
  expect(container.querySelector("img")).toBeNull();
  rerender(<Image remoteSrc="not a valid URL" alt="Malformed image" />);
  expect(container.querySelector("img")).toBeNull();
});

it("renders nothing when no registered or remote image is supplied", () => {
  const { container } = render(<Image alt="Missing image" />);
  expect(container.querySelector("img")).toBeNull();
});
