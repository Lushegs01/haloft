import Image from "next/image";

/**
 * Facade — the photograph a surface shows when the catalogue has none of
 * its own.
 *
 * Listing photography on this site is real: it comes from the catalogue,
 * shot on the verification visit. Everywhere else — the hero, the trust
 * section, the owner band, a card whose property hasn't been photographed
 * yet — we still owe the reader a picture of the kind of place Haloft is
 * about. These six are it: student blocks, estate terraces and compounds
 * photographed in Lagos and elsewhere in Nigeria. Provenance and credits
 * are recorded in docs/IMAGERY.md.
 *
 * They are decorative, never evidence. A card standing in for a property
 * we have not photographed keeps its own label saying so — the picture
 * below it is not that building and must not be captioned as though it
 * were.
 *
 * The component fills its parent absolutely, so that parent must be
 * positioned and carry its own height or aspect ratio. Frames range from
 * a 3.4:1 strip to a 5:6 portrait, so each façade also carries the focal
 * point that survives the crop.
 */

export type FacadeVariant =
  | "tower"
  | "block"
  | "terrace"
  | "court"
  | "estate"
  | "hostel";

const FACADES: Record<
  FacadeVariant,
  { src: string; position: string; blurDataURL: string }
> = {
  /** A residential tower on Lagos Island, seen from the street. */
  tower: {
    src: "/imagery/tower.jpg",
    position: "50% 40%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABMNDhEODBMRDxEVFBMXHTAfHRoaHToqLCMwRT1JR0Q9Q0FMVm1dTFFoUkFDX4JgaHF1e3x7SlyGkIV3j214e3b/2wBDARQVFR0ZHTgfHzh2T0NPdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnb/wAARCAAQAAwDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAMG/8QAIhAAAgEDAgcAAAAAAAAAAAAAAQIDAAQREiIFEzFBUaGx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAwT/xAAZEQEAAwEBAAAAAAAAAAAAAAABAAIDERL/2gAMAwEAAhEDEQA/ABxcOkmgeZGG1iNJ74Uk/KmsJKg1obaMQqiMQra2JBPlMD3RL7kpdvl0Grd1FPXQ9Iye2bwSf//Z",
  },
  /** Balconied flats in terracotta and cream — the warm end of the palette. */
  block: {
    src: "/imagery/block.jpg",
    position: "50% 50%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABMNDhEODBMRDxEVFBMXHTAfHRoaHToqLCMwRT1JR0Q9Q0FMVm1dTFFoUkFDX4JgaHF1e3x7SlyGkIV3j214e3b/2wBDARQVFR0ZHTgfHzh2T0NPdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnb/wAARCAAOAAwDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABQED/8QAIRAAAgAFBAMAAAAAAAAAAAAAAQIAERITIQMFFHExQYH/xAAUAQEAAAAAAAAAAAAAAAAAAAAB/8QAFhEBAQEAAAAAAAAAAAAAAAAAAQAD/9oADAMBAAIRAxEAPwC8nRuWiVq9NTjqNQolhh8MC7YxYFjkioknqUKW5s8gvmB1RkxEv//Z",
  },
  /** A street of estate terraces off the Lekki–Epe corridor. */
  terrace: {
    src: "/imagery/terrace.jpg",
    position: "50% 55%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABMNDhEODBMRDxEVFBMXHTAfHRoaHToqLCMwRT1JR0Q9Q0FMVm1dTFFoUkFDX4JgaHF1e3x7SlyGkIV3j214e3b/2wBDARQVFR0ZHTgfHzh2T0NPdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnb/wAARCAAJAAwDASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAgMEBf/EACAQAAICAgAHAAAAAAAAAAAAAAECAAMFEQQSITJBYYH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AG15QpWGrU2bG9MOUb9TN4jLWG0l6i7HqSxh+fknfuhH/9k=",
  },
  /**
   * The open walkway of a compound, from the courtyard it wraps. Shot at
   * golden hour, so the master is graded down a little — saturation and
   * shadows both — to stop it shouting over the rest of the set.
   */
  court: {
    src: "/imagery/court.jpg",
    position: "50% 60%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABMNDhEODBMRDxEVFBMXHTAfHRoaHToqLCMwRT1JR0Q9Q0FMVm1dTFFoUkFDX4JgaHF1e3x7SlyGkIV3j214e3b/2wBDARQVFR0ZHTgfHzh2T0NPdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnb/wAARCAAQAAwDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAMF/8QAIBAAAgICAgIDAAAAAAAAAAAAAQMCEQAEEnExMiFRof/EABUBAQEAAAAAAAAAAAAAAAAAAAID/8QAGBEAAgMAAAAAAAAAAAAAAAAAABEBAhL/2gAMAwEAAhEDEQA/AM/XMlwZLUMGrJF/Isdg+MmzYlJhM2Kifq+X7hNjXWtDanEMi/jEE+0K813gzYPtfRwRVl9o/9k=",
  },
  /** Mid-rise blocks around a shared car park and trees. */
  estate: {
    src: "/imagery/estate.jpg",
    position: "50% 55%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABMNDhEODBMRDxEVFBMXHTAfHRoaHToqLCMwRT1JR0Q9Q0FMVm1dTFFoUkFDX4JgaHF1e3x7SlyGkIV3j214e3b/2wBDARQVFR0ZHTgfHzh2T0NPdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnb/wAARCAAHAAwDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAH/xAAeEAACAgICAwAAAAAAAAAAAAABAgADESEGEhVBYf/EABUBAQEAAAAAAAAAAAAAAAAAAAEC/8QAFREBAQAAAAAAAAAAAAAAAAAAAQD/2gAMAwEAAhEDEQA/AJ5S2lG2vUAaKA49airkNpTLVLn4BESFSG//2Q==",
  },
  /** A student hostel block set back behind its lawn. */
  hostel: {
    src: "/imagery/hostel.jpg",
    position: "38% 55%",
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABMNDhEODBMRDxEVFBMXHTAfHRoaHToqLCMwRT1JR0Q9Q0FMVm1dTFFoUkFDX4JgaHF1e3x7SlyGkIV3j214e3b/2wBDARQVFR0ZHTgfHzh2T0NPdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnb/wAARCAAMAAwDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABQQG/8QAIBAAAgEDBAMAAAAAAAAAAAAAAQIDAAQFERITITFBgf/EABQBAQAAAAAAAAAAAAAAAAAAAAL/xAAXEQADAQAAAAAAAAAAAAAAAAAAAQID/9oADAMBAAIRAxEAPwBUZy2mKsA4IHsdCj7nJQySk8cx0612+ayscrxKux2H2q0uJSoJkai9aQD/2Q==",
  },
};

/**
 * The order card grids walk. Neighbouring tiles land on different
 * buildings, and a row of six never shows the same façade twice.
 */
export const FACADE_ROTATION: readonly FacadeVariant[] = [
  "block",
  "terrace",
  "court",
  "hostel",
  "estate",
  "tower",
];

/** The façade for the nth tile in a grid. */
export function facadeForIndex(index: number): FacadeVariant {
  return FACADE_ROTATION[index % FACADE_ROTATION.length];
}

export function Facade({
  variant = "block",
  className = "",
  /** What the frame measures at each breakpoint — keeps mobile off the
   *  1600px master. */
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw",
  priority = false,
}: {
  variant?: FacadeVariant;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const facade = FACADES[variant];

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <Image
        src={facade.src}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        placeholder="blur"
        blurDataURL={facade.blurDataURL}
        className="object-cover"
        style={{ objectPosition: facade.position }}
      />
    </div>
  );
}
