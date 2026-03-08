import "./globals.css";
import ThemeRegistry from "@/theme/ThemeRegistry";

export const metadata = {
  title: "Punctoo",
  description: "Tijdsregistratie met ScanTag",
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}