import type { TextField } from "@payloadcms/plugin-form-builder/types";
import type { FieldErrorsImpl, FieldValues, UseFormRegister } from "react-hook-form";

import { Label } from "@/amerta/theme/ui/label";
import React, { useState, useRef, useEffect } from "react";

import { Error } from "../Error";
import { Width } from "../Width";

export const Rating: React.FC<
  TextField & {
    errors: Partial<FieldErrorsImpl>;
    register: UseFormRegister<FieldValues>;
    starSize?: number;
    setValue: (name: string, value: any) => void;
  }
> = ({ name, defaultValue, errors, label, setValue, register, required, starSize = 24, width }) => {
  const [rating, setRating] = useState<number>(defaultValue ? parseFloat(defaultValue) : 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Calculate which star (0-4) and whether left or right half
    const starIndex = Math.floor(x / 40);
    const isRightHalf = x % 40 > 20;

    const newRating = starIndex + (isRightHalf ? 1 : 0.5);
    setHoverRating(Math.min(newRating, 5));
  };

  const handleClick = () => {
    setRating(hoverRating);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  useEffect(() => {
    setValue(name, rating);
  }, [rating, name, setValue]);

  const displayRating = hoverRating || rating;

  const StarSVG = ({ index }: { index: number }) => {
    const starStart = index;
    const starEnd = index + 1;
    const isFull = displayRating >= starEnd;
    const isHalf = displayRating > starStart && displayRating < starEnd;

    return (
      <svg
        key={index}
        className="c-star"
        width={starSize}
        height={starSize}
        viewBox="0 0 32 32"
        style={{
          cursor: "pointer",
          opacity: isFull || isHalf ? 1 : 0.3,
          transition: "opacity 0.2s",
        }}
      >
        <defs>
          <mask id={`half-${index}`}>
            <rect x="0" y="0" width="32" height="32" fill="white" />
            <rect x="50%" y="0" width="16" height="32" fill="black" />
          </mask>
        </defs>
        {isFull ? (
          <path d="M31.547 12a.848.848 0 00-.677-.577l-9.427-1.376-4.224-8.532a.847.847 0 00-1.516 0l-4.218 8.534-9.427 1.355a.847.847 0 00-.467 1.467l6.823 6.664-1.612 9.375a.847.847 0 001.23.893l8.428-4.434 8.432 4.432a.847.847 0 001.229-.894l-1.615-9.373 6.822-6.665a.845.845 0 00.214-.869z" fill="currentColor" />
        ) : isHalf ? (
          <>
            <path d="M31.547 12a.848.848 0 00-.677-.577l-9.427-1.376-4.224-8.532a.847.847 0 00-1.516 0l-4.218 8.534-9.427 1.355a.847.847 0 00-.467 1.467l6.823 6.664-1.612 9.375a.847.847 0 001.23.893l8.428-4.434 8.432 4.432a.847.847 0 001.229-.894l-1.615-9.373 6.822-6.665a.845.845 0 00.214-.869z" fill="currentColor" mask={`url(#half-${index})`} />
            <path d="M31.547 12a.848.848 0 00-.677-.577l-9.427-1.376-4.224-8.532a.847.847 0 00-1.516 0l-4.218 8.534-9.427 1.355a.847.847 0 00-.467 1.467l6.823 6.664-1.612 9.375a.847.847 0 001.23.893l8.428-4.434 8.432 4.432a.847.847 0 001.229-.894l-1.615-9.373 6.822-6.665a.845.845 0 00.214-.869z" fill="currentColor" opacity="0.3" />
          </>
        ) : (
          <path d="M31.547 12a.848.848 0 00-.677-.577l-9.427-1.376-4.224-8.532a.847.847 0 00-1.516 0l-4.218 8.534-9.427 1.355a.847.847 0 00-.467 1.467l6.823 6.664-1.612 9.375a.847.847 0 001.23.893l8.428-4.434 8.432 4.432a.847.847 0 001.229-.894l-1.615-9.373 6.822-6.665a.845.845 0 00.214-.869z" fill="currentColor" opacity="0.3" />
        )}
      </svg>
    );
  };

  return (
    <Width width={width}>
      {label && (
        <Label htmlFor={name}>
          {label}
          {required && (
            <span className="required">
              * <span className="sr-only">(required)</span>
            </span>
          )}
        </Label>
      )}
      <div ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onClick={handleClick} className="flex gap-2 p-2 cursor-pointer" role="slider" aria-label={`${displayRating} out of 5 stars`} aria-valuemin={0} aria-valuemax={5} aria-valuenow={displayRating} tabIndex={0}>
        {[0, 1, 2, 3, 4].map((index) => (
          <StarSVG key={index} index={index} />
        ))}
      </div>
      <input id={name} type="hidden" {...register(name, { required, value: rating })} />
      {rating > 0 && <p className="mt-2 text-sm text-gray-600">{rating} out of 5 stars</p>}
      {errors[name] && <Error />}
    </Width>
  );
};
