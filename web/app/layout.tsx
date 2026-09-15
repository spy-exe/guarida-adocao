import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";

const titulo = Fraunces({ subsets: ["latin"], variable: "--fonte-fraunces", display: "swap" });
const texto = Geist({ subsets: ["latin"], variable: "--fonte-geist", display: "swap" });

export const metadata: Metadata = {
  title: "Guarida · adoção de animais",
  description: "Animais esperando adoção em abrigos da região, com ficha, história e fotos. Mande seu pedido sem criar conta."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${texto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
