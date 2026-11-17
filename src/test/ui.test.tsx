import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Services from "@/pages/Services";
import NotFound from "@/pages/NotFound";
import ContactModal from "@/components/ContactModal";
import PortfolioModal from "@/components/PortfolioModal";

describe("Services page", () => {
  it("keeps the approved pricing and contact routes", () => {
    render(<MemoryRouter><Services /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Small digital jobs.");
    expect(screen.getAllByText("₹149")).toHaveLength(2);
    expect(screen.getByText("₹299")).toBeInTheDocument();
    expect(screen.getByText("From ₹799")).toBeInTheDocument();
    const whatsapp = screen.getAllByRole("link").filter((a) => a.getAttribute("href")?.startsWith("https://wa.me/918189936361"));
    expect(whatsapp.length).toBeGreaterThanOrEqual(2);
    whatsapp.forEach((a) => expect(a).toHaveAttribute("rel", "noopener noreferrer"));
  });
});

describe("Not found page", () => {
  it("shows the missing path and links back to real routes", () => {
    render(<MemoryRouter initialEntries={["/old-link"]}><NotFound /></MemoryRouter>);
    expect(screen.getByText("/old-link")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /digital services/i })).toHaveAttribute("href", "/services");
  });
});

describe("Contact dialog", () => {
  it("is a labelled modal that focuses the first field and closes on Escape", () => {
    const onClose = vi.fn();
    render(<ContactModal isOpen onClose={onClose} />);
    const dialog = screen.getByRole("dialog", { name: /get in touch/i });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByLabelText("Name")).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps Tab focus inside the dialog", () => {
    render(<ContactModal isOpen onClose={() => {}} />);
    const whatsapp = screen.getByRole("link", { name: "8189936361" });
    whatsapp.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(screen.getByRole("button", { name: /close contact form/i })).toHaveFocus();
  });

  it("renders nothing when closed", () => {
    render(<ContactModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Portfolio dialog", () => {
  it("is labelled and closes on Escape", () => {
    const onClose = vi.fn();
    render(<PortfolioModal isOpen onClose={onClose} />);
    expect(screen.getByRole("dialog", { name: /my work/i })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
