"use client";
import { AlertTriangle } from "lucide-react";
export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-[#fff0f1] text-[#a9434c]">
          <AlertTriangle className="size-5" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-[-.03em]">
          This page couldn&apos;t load.
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#718095]">
          Your company data is safe. Try loading the page again.
        </p>
        <button
          onClick={reset}
          className="mt-6 min-h-11 rounded-xl bg-[#3158d8] px-5 text-sm font-semibold text-white"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
