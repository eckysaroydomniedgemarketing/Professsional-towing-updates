interface ContentContainerProps {
  children: React.ReactNode;
}

export function ContentContainer({ children }: ContentContainerProps) {
  return (
    <main className="flex-1 p-6 relative overflow-auto">
      <div className="relative z-10">{children}</div>
    </main>
  );
}