import React from 'react';

export const formatSmallPrice = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "--";
  if (value >= 0.01) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value);
  }

  const str = value.toFixed(20);
  const match = str.match(/^0\.0+/);
  if (match) {
    const zeroCount = match[0].length - 2;
    if (zeroCount >= 2) {
      const remainingDigits = str.slice(match[0].length).slice(0, 4);
      return (
        <span className="inline-flex items-center leading-none">
          $0.0<sub className="text-[0.65em] relative top-[0.1em] px-[1px]">{zeroCount}</sub>
          {remainingDigits}
        </span>
      );
    }
  }
  return `$${value}`;
};

export const formatCurrencyCompact = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatChange = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "--";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
};
