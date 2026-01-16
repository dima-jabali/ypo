"use client";

import { Bot, Database, MessageCircle } from "lucide-react";

type EmptyDataProps = {
  description: string;
  title: string;
};

export function EmptyData({
  description,
  children,
  title,
}: React.PropsWithChildren<EmptyDataProps>) {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full h-full px-10 py-12">
      <section className="flex items-center justify-center gap-2">
        <div className="p-2 border border-border-smooth rounded-lg -rotate-12">
          <Bot className="size-6 stroke-primary stroke-1" />
        </div>

        <div className="p-2 border border-border-smooth rounded-lg relative bottom-1">
          <MessageCircle className="size-6 stroke-primary stroke-1" />
        </div>

        <div className="p-2 border border-border-smooth rounded-lg rotate-12">
          <Database className="stroke-primary size-6 stroke-1" />
        </div>
      </section>

      <div className="flex flex-col items-center justify-center gap-1 w-full">
        <h3>{title}</h3>

        <p className="font-light text-sm text-center text-default-badge">{description}</p>
      </div>

      {children}
    </div>
  );
}
