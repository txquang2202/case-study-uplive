import "../styles/globals.css";

export const metadata = {
  title: "Case Study - Fullstack App",
  description: "Fullstack application with Next.js and NestJS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
