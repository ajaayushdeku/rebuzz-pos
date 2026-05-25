export default function ProfileMainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className=" transition-all duration-300 md:pl-56">
      {children}
    </main>
  );
}
